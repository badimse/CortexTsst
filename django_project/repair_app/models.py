from django.db import models
from django.utils import timezone

class ServiceProvider(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    completed_count = models.IntegerField(default=0)
    badge = models.CharField(max_length=100, blank=True, null=True)
    inpost_locker_id = models.CharField(max_length=12) # e.g. POZ32M
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class RepairOrder(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'Nowe zlecenie'),
        ('AWAITING_SHIPMENT', 'Oczekuje na nadanie kaucji'),
        ('IN_TRANSIT_TO_SERVICE', 'W drodze do serwisu'),
        ('IN_DIAGNOSIS', 'W trakcie diagnostyki'),
        ('AWAITING_COST_APPROVAL', 'Oczekiwanie na akceptację wyceny'),
        ('IN_REPAIR', 'Naprawa trwająca'),
        ('TESTING_AND_REPORTING', 'Testowanie i sporządzanie protokołu'),
        ('RETURN_IN_TRANSIT', 'Odesłane do klienta'),
        ('DELIVERED_AWAITING_CONFIRMATION', 'Dostarczone - oczekuje na odbiór i testy'),
        ('COMPLETED', 'Zakończone pomyślnie'),
        ('DISPUTED', 'Zgłoszono spór'),
    ]

    ESCROW_STATUS_CHOICES = [
        ('UNPAID', 'Nieopłacone'),
        ('FROZEN_DIAGNOSIS', 'Kaucja diagnostyczna zamrożona'),
        ('FROZEN_REPAIR', 'Pełne środki na naprawę zamrożone'),
        ('RELEASED', 'Środki wypłacone serwisowi'),
        ('REFUNDED', 'Zwrócone klientowi'),
    ]

    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.RESTRICT, related_name='orders')
    client_name = models.CharField(max_length=150)
    client_email = models.EmailField(max_length=150)
    device_name = models.CharField(max_length=150)
    description = models.TextField()
    image_before_url = models.TextField(blank=True, null=True)
    image_after_url = models.TextField(blank=True, null=True)
    
    # Process Statuses
    status = models.CharField(max_length=40, choices=STATUS_CHOICES, default='NEW')
    
    # Financial data
    repair_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    repair_summary = models.TextField(blank=True, null=True)
    
    # InPost Logistics data
    start_locker = models.CharField(max_length=12, blank=True, null=True)
    target_locker = models.CharField(max_length=12, blank=True, null=True)
    tracking_code_inbound = models.CharField(max_length=50, blank=True, null=True)
    tracking_code_outbound = models.CharField(max_length=50, blank=True, null=True)
    label_pdf_url = models.TextField(blank=True, null=True)
    report_pdf_url = models.TextField(blank=True, null=True)
    
    # Stripe Escrow status
    escrow_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    escrow_status = models.CharField(max_length=30, choices=ESCROW_STATUS_CHOICES, default='UNPAID')
    
    # Reviews
    client_rating = models.SmallIntegerField(blank=True, null=True)
    client_review = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Zlecenie #{self.id} - {self.device_name} ({self.client_name})"

class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ('CLIENT', 'Klient'),
        ('SERVICE', 'Serwis'),
        ('SYSTEM', 'System'),
    ]

    order = models.ForeignKey(RepairOrder, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"[{self.sender}] {self.text[:30]}"

class SystemLog(models.Model):
    CATEGORY_CHOICES = [
        ('ORDER', 'Zlecenie'),
        ('ESCROW', 'Depozyt Escrow'),
        ('LOGISTICS', 'Logistyka InPost'),
        ('COMMUNICATION', 'Komunikacja'),
    ]

    order = models.ForeignKey(RepairOrder, on_delete=models.CASCADE, related_name='logs', blank=True, null=True)
    action = models.CharField(max_length=100)
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES)
    details = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"[{self.category}] {self.action} - {self.timestamp}"
