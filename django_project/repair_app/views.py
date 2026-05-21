from django.shortcuts import render, get_object_or_454
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
import decimal
from .models import ServiceProvider, RepairOrder, ChatMessage, SystemLog

# Helper to serialize decimal values
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def index_view(request):
    """
    Renders the modern, responsive unified SPA dashboard.
    This template holds all visual themes, HTML5, Tailwind classes, and Fetch controllers.
    """
    return render(request, 'repair_app/index.html')

# --- API ENDPOINTS ---

def get_services(request):
    """GET list of active repair shops / services"""
    services = ServiceProvider.objects.all().order_by('-rating')
    data = []
    for s in services:
        data.append({
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'rating': float(s.rating),
            'completedCount': s.completed_count,
            'badge': s.badge,
            'inpostLockerId': s.inpost_locker_id,
            'address': s.address,
        })
    return JsonResponse({'services': data})

@csrf_exempt
def create_order(request):
    """POST request to spin up a new order and mock initial deposit setup"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body)
        service_id = body.get('serviceId')
        service = get_object_or_454(ServiceProvider, id=service_id)
        
        order = RepairOrder.objects.create(
            service_provider=service,
            client_name=body.get('clientName', 'Nienazwany Klient'),
            client_email=body.get('clientEmail', 'Biber.Adrian@gmail.com'),
            device_name=body.get('deviceName', 'Urządzenie'),
            description=body.get('description', 'Brak opisu usterki.'),
            image_before_url=body.get('imageBeforeUrl', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop'),
            status='NEW',
            escrow_amount=decimal.Decimal('0.00'),
            escrow_status='UNPAID'
        )
        
        # Log system trigger
        SystemLog.objects.create(
            order=order,
            action="Inicjalizacja",
            category="ORDER",
            details=f"Zlecenie #{order.id} zostało złożone przez klienta dla serwisu: {service.name}."
        )
        
        ChatMessage.objects.create(
            order=order,
            sender='SYSTEM',
            text="Zlecenie zostało poprawnie utworzone. Aby wygenerować kod nadania InPost i przekazać paczkę do diagnostyki, wymagane jest zablokowanie kaucji diagnostycznej wysokości 40.00 PLN."
        )
        
        return JsonResponse({
            'success': True,
            'orderId': order.id,
            'message': 'Order registered successfully.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_order_details(request, order_id):
    """GET order statistics, logbook and chat history"""
    order = get_object_or_454(RepairOrder, id=order_id)
    
    messages = ChatMessage.objects.filter(order=order).order_by('timestamp')
    chat_list = [{
        'id': m.id,
        'sender': m.sender,
        'text': m.text,
        'timestamp': m.timestamp.isoformat(),
        'isRead': m.is_read
    } for m in messages]
    
    logs = SystemLog.objects.filter(order=order).order_by('-timestamp')
    logs_list = [{
        'id': l.id,
        'action': l.action,
        'category': l.category,
        'details': l.details,
        'timestamp': l.timestamp.isoformat()
    } for l in logs]
    
    order_data = {
        'id': order.id,
        'serviceProviderId': order.service_provider.id,
        'serviceName': order.service_provider.name,
        'clientName': order.client_name,
        'clientEmail': order.client_email,
        'deviceName': order.device_name,
        'description': order.description,
        'imageBeforeUrl': order.image_before_url,
        'imageAfterUrl': order.image_after_url,
        'status': order.status,
        'repairCost': float(order.repair_cost),
        'repairSummary': order.repair_summary,
        'startLocker': order.start_locker,
        'targetLocker': order.target_locker,
        'trackingCodeInbound': order.tracking_code_inbound,
        'trackingCodeOutbound': order.tracking_code_outbound,
        'labelPdfUrl': order.label_pdf_url,
        'reportPdfUrl': order.report_pdf_url,
        'escrowAmount': float(order.escrow_amount),
        'escrowStatus': order.escrow_status,
        'clientRating': order.client_rating,
        'clientReview': order.client_review,
        'createdAt': order.created_at.isoformat(),
    }
    
    return JsonResponse({
        'order': order_data,
        'messages': chat_list,
        'logs': logs_list
    })

@csrf_exempt
def send_message(request, order_id):
    """POST request to send a chat message inside an order"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    order = get_object_or_454(RepairOrder, id=order_id)
    try:
        body = json.loads(request.body)
        sender = body.get('sender') # CLIENT or SERVICE
        text = body.get('text')
        
        if not sender or not text:
            return JsonResponse({'error': 'Missing sender or text'}, status=400)
            
        msg = ChatMessage.objects.create(
            order=order,
            sender=sender,
            text=text
        )
        return JsonResponse({'success': True, 'id': msg.id})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def trigger_action(request, order_id):
    """
    POST request to handle simulated state transitions (Stripe payment, InPost courier simulation, diagnostics, disputes)
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
        
    order = get_object_or_454(RepairOrder, id=order_id)
    try:
        body = json.loads(request.body)
        action_type = body.get('action') # 'PAY_DIAGNOSIS', 'SHIPPED_BY_CLIENT', 'DELIVERED_TO_SERVICE' etc.
        
        now = timezone.now()
        
        if action_type == 'PAY_DIAGNOSIS':
            order.status = 'AWAITING_SHIPMENT'
            order.escrow_status = 'FROZEN_DIAGNOSIS'
            order.escrow_amount = decimal.Decimal('40.00')
            order.start_locker = body.get('lockerId', 'WAW14A')
            order.target_locker = order.service_provider.inpost_locker_id
            order.tracking_code_inbound = "INP-DIAG-729481"
            order.label_pdf_url = "/static/labels/mock_label.pdf"
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Płatność kaucji",
                category="ESCROW",
                details="Płatność 40 PLN kaucji diagnostycznej zdeponowana pomyślnie."
            )
            SystemLog.objects.create(
                order=order,
                action="Wygenerowano etykietę",
                category="LOGISTICS",
                details=f"Paczkomat nadawczy: {order.start_locker}. Paczkomat docelowy: {order.target_locker}. Kod bezetykietowy: 729-481."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text=f"Autoryzacja Stripe powiodła się. Zabezpieczono 40.00 PLN depozytu. Nadaj paczkę bezetykietowo w Paczkomacie {order.start_locker} używając kodu: 729-481."
            )
            
        elif action_type == 'SHIPPED_BY_CLIENT':
            order.status = 'IN_TRANSIT_TO_SERVICE'
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Niesienie w drodze",
                category="LOGISTICS",
                details=f"Klient umieścił przesyłkę w automacie paczkowym {order.start_locker}."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text=f"Przesyłka została pomyślnie nadana w Paczkomacie {order.start_locker}. Trasa do serwisu rozpoczęta."
            )
            
        elif action_type == 'DELIVERED_TO_SERVICE':
            order.status = 'IN_DIAGNOSIS'
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Dostarczono do serwisu",
                category="LOGISTICS",
                details=f"Kurier InPost dostarczył przesyłkę do skrytki serwisu: {order.target_locker}."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text="Paczka odebrana przez serwis paczkowy. Inżynierzy zlecający diagnostykę rozpoczynają rezonans i pomiar płyty głównej."
            )
            
        elif action_type == 'SUBMIT_DIAGNOSIS':
            cost = decimal.Decimal(str(body.get('cost', '350.00')))
            summary = body.get('summary', 'Wymiana uszkodzonych sekcji zasilania.')
            
            order.status = 'AWAITING_COST_APPROVAL'
            order.repair_cost = cost
            order.repair_summary = summary
            order.report_pdf_url = "/static/reports/raport_diagnostyki.pdf"
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Raport serwisowy",
                category="ORDER",
                details=f"Ukończono fazę diagnostyczną. Koszt naprawy wyceniono na: {cost} PLN. Protokół PDF załączony."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SERVICE',
                text=f"Zdiagnozowałem usterkę urządzenia. Szczegóły: {summary}. Łączny koszt naprawy (części + robocizna) to {cost} PLN. Proszę o zatwierdzenie wyceny i dopłatę depozytu w celu rozpoczęcia procedury naprawy."
            )
            
        elif action_type == 'APPROVE_REPAIR':
            # Client deposits the cost of repair
            new_amount = order.escrow_amount + order.repair_cost
            order.status = 'IN_REPAIR'
            order.escrow_status = 'FROZEN_REPAIR'
            order.escrow_amount = new_amount
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Zatwierdzenie naprawy",
                category="ESCROW",
                details=f"Zabezpieczono dodatkowe {order.repair_cost} PLN we wzmocnionym depozycie escrow zintegrowanym ze Stripe."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text=f"Finansowanie zlecenia zabezpieczone. Łączny zamrożony budżet escrow w Stripe wynosi obecnie: {new_amount} PLN. Serwis przystępuje do fizycznego lutowania podzespołów."
            )
            
        elif action_type == 'COMPLETE_REPAIR_WORK':
            # Service finishes the soldering/repair
            order.status = 'TESTING_AND_REPORTING'
            order.image_after_url = body.get('imageAfterUrl', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop')
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Naprawa ukończona",
                category="ORDER",
                details="Testy stabilnościowe (AIDA64/3DMark/termowizja) zaliczone pomyślnie. Zdjęcie końcowe opublikowane."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SERVICE',
                text="Prace lutownicze ukończone, wykonana diagnostyka termowizyjna potwierdza stabilne temperatury i brak zwarć. Urządzenie przechodzi w fazę pakowania logistyki zwrotnej."
            )
            
        elif action_type == 'SHIP_BACK_TO_CLIENT':
            order.status = 'RETURN_IN_TRANSIT'
            order.tracking_code_outbound = "INP-RTN-998877"
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Nadanie zwrotne",
                category="LOGISTICS",
                details="Przesyłka powrotna przekazana kurierowi InPost. Kod śledzenia: INP-RTN-998877."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text="Naprawiony sprzęt opuścił warsztat. Przesyłka zwrotna InPost jest aktualnie w tranzycie kierunkowym do Twojego Paczkomatu domowego."
            )
            
        elif action_type == 'ARRIVED_TO_CLIENT_LOCKER':
            order.status = 'DELIVERED_AWAITING_CONFIRMATION'
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Przesyłka w paczkomacie",
                category="LOGISTICS",
                details="Kurier dostarczył zwrotną przesyłkę z urządzeniem do Paczkomatu klienta."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text="Dobre wieści! Twój naprawiony sprzęt czeka gotowy do odbioru w Paczkomacie nadawczym. Odbierz paczkę, przetestuj urządzenie, a następnie potwierdź sprawność w panelu, by zwolnić środki z depozytu."
            )
            
        elif action_type == 'CONFIRM_DELIVERY_OK':
            # Release escrow to service
            order.status = 'COMPLETED'
            order.escrow_status = 'RELEASED'
            order.client_rating = body.get('rating', 5)
            order.client_review = body.get('review', 'Znakomita, bezpieczna realizacja!')
            order.save()
            
            # Update rating of service provider
            service = order.service_provider
            service.completed_count += 1
            # Dynamic rating recalculation
            service.rating = (service.rating * decimal.Decimal('0.9')) + (decimal.Decimal(str(order.client_rating)) * decimal.Decimal('0.1'))
            service.save()
            
            SystemLog.objects.create(
                order=order,
                action="Środki wypłacone",
                category="ESCROW",
                details=f"Zwolniono kaucję (łącznie: {order.escrow_amount} PLN) na konto Stripe Connect serwisu {service.name}."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text="Zlecenie oficjalnie zakończone. Klient przetestował urządzenie i zatwierdził zgodność. Środki z kredytu zabezpieczonego Stripe zostały przetransferowane na konto bankowe serwisu."
            )
            
        elif action_type == 'RAISE_DISPUTE':
            order.status = 'DISPUTED'
            order.save()
            
            SystemLog.objects.create(
                order=order,
                action="Zgłoszenie sporu",
                category="ORDER",
                details=f"Wniesienie dysputy przez klienta. Powód: {body.get('reason', 'Niezgodność z opisem')}. Blokada środków zablokowanych w Stripe."
            )
            ChatMessage.objects.create(
                order=order,
                sender='CLIENT',
                text=f"[SPÓR SYNDYKATU] Zgłaszam reklamację na wykonaną usługę. Powód: {body.get('reason')}."
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text="Ostrzeżenie: Zlecenie weszło w stan sporu. Całość środków w dyspozycji Stripe pozostaje bezpiecznie zamrożona. Arbiter systemowy został poinformowany o konieczności weryfikacji dokumentacji."
            )
            
        elif action_type == 'RESOLVE_DISPUTE':
            resolution = body.get('resolution') # 'RELEASE_ALL', 'REFUND_ALL', 'SPLIT_50_50'
            fees = order.escrow_amount
            
            if resolution == 'RELEASE_ALL':
                order.status = 'COMPLETED'
                order.escrow_status = 'RELEASED'
                log_details = f"Środki ({fees} PLN) w całości przekazane dla serwisu po arbitrażu ad hoc."
            elif resolution == 'REFUND_ALL':
                order.status = 'COMPLETED'
                order.escrow_status = 'REFUNDED'
                log_details = f"Środki ({fees} PLN) w całości zwrócone na kartę klienta po arbitrażu."
            else: # SPLIT_50_50
                order.status = 'COMPLETED'
                order.escrow_status = 'RELEASED' # representation
                log_details = "Równy podział środków 50/50 między serwisem a klientem."
                
            order.save()
            SystemLog.objects.create(
                order=order,
                action="Rozstrzygnięcie sporu",
                category="ESCROW",
                details=log_details
            )
            ChatMessage.objects.create(
                order=order,
                sender='SYSTEM',
                text=f"Arbitraż administratora został pomyślnie rozstrzygnięty. Decyzja: {log_details}"
            )
            
        return JsonResponse({'success': True, 'status': order.status, 'escrowStatus': order.escrow_status})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
