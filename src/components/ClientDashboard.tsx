/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Lock, Star, MessageSquare, PlusCircle, 
  Send, FileText, Activity, CreditCard, ThumbsUp, 
  Download, AlertCircle, MapPin, CheckCircle2, X 
} from 'lucide-react';
import { ServiceProfile, RepairOrder, ChatMessage, SystemLog, OrderStatus, EscrowStatus } from '../types';

interface ClientDashboardProps {
  orders: RepairOrder[];
  services: ServiceProfile[];
  chats: ChatMessage[];
  onAddOrder: (newOrder: RepairOrder, initialMessage: string) => void;
  onUpdateOrder: (updated: RepairOrder) => void;
  onAddChatMessage: (chat: ChatMessage) => void;
  onAddSystemLog: (log: SystemLog) => void;
}

export default function ClientDashboard({
  orders,
  services,
  chats,
  onAddOrder,
  onUpdateOrder,
  onAddChatMessage,
  onAddSystemLog
}: ClientDashboardProps) {
  // Navigation & interaction states
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(orders.length ? orders[0].id : null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPaying, setIsPaying] = useState<'NONE' | 'DIAGNOSIS' | 'REPAIR'>('NONE');
  const [isRating, setIsRating] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Stripe card simulator state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('ADRIAN BIBER');
  const [stripeProcessing, setStripeProcessing] = useState(false);

  // Chat message input
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // New repair form state
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newCategory, setNewCategory] = useState<'Smartfony' | 'Laptopy' | 'Konsole' | 'Inne'>('Smartfony');
  const [newDescription, setNewDescription] = useState('');
  const [newServiceId, setNewServiceId] = useState<number>(services[0]?.id || 1);
  const [newImageFileUrl, setNewImageFileUrl] = useState<string | null>(null);
  const [lockerCode, setLockerCode] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedOrderId]);

  // Find currently active structures
  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const activeService = activeOrder ? services.find(s => s.id === activeOrder.serviceProviderId) : null;
  const activeChats = chats.filter(c => c.orderId === selectedOrderId);

  // Handles drag & drop for file upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulates standard order creation and diag payment required status
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newDescription) return;

    const generatedId = Math.floor(100 + Math.random() * 900);
    const mockOrder: RepairOrder = {
      id: generatedId,
      clientName: 'Adrian Biber',
      clientEmail: 'Biber.Adrian@gmail.com',
      deviceName: newDeviceName,
      category: newCategory,
      description: newDescription,
      status: 'NEW', // Must pay diagnosis fee first
      serviceProviderId: newServiceId,
      imageBeforeUrl: newImageFileUrl || 'https://images.unsplash.com/photo-1591405351990-4726e33df58d?w=600&auto=format&fit=crop',
      imageAfterUrl: null,
      diagnosisFee: 40,
      repairCost: null,
      trackingCodeInbound: null,
      trackingCodeOutbound: null,
      startLocker: null,
      targetLocker: null,
      escrowStatus: 'NONE',
      escrowAmount: 0,
      labelPdfUrl: null,
      reportPdfUrl: null,
      repairSummary: null,
      clientRating: null,
      clientReview: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddOrder(mockOrder, `Zgłoszenie naprawy ${newDeviceName} zostało zarejestrowane w systemie Cortex! Prosimy o opłacenie depozytu diagnozy 40 PLN w celu odblokowania logistyki bezetykietowej InPost.`);
    setSelectedOrderId(generatedId);
    setIsCreating(false);

    // reset fields
    setNewDeviceName('');
    setNewDescription('');
    setNewImageFileUrl(null);
  };

  // Simulated Payment Execution (Stripe checkout mockup with real backend endpoints)
  const executePayment = async () => {
    if (!activeOrder) return;
    setStripeProcessing(true);

    try {
      if (isPaying === 'DIAGNOSIS') {
        // 1. Charge Diagnosis/Shipping (40 PLN) on backend
        const chargeRes = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            amount: 40,
            paymentType: 'DIAGNOSIS',
            cardNumber,
            cardName
          })
        });

        if (!chargeRes.ok) {
          const errData = await chargeRes.json();
          alert(`Błąd płatności Stripe: ${errData.error || 'Nieznany błąd'}`);
          setStripeProcessing(false);
          return;
        }

        const chargeResult = await chargeRes.json();

        // 2. Dispatch InPost label creation on backend
        const labelRes = await fetch('/api/inpost/generate-label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            serviceProviderId: activeOrder.serviceProviderId,
            startLocker: lockerCode || 'KRA01N',
            shipmentType: 'INBOUND'
          })
        });

        if (!labelRes.ok) {
          const errData = await labelRes.json();
          alert(`Błąd logistyki InPost: ${errData.error || 'Nieznany błąd'}`);
          setStripeProcessing(false);
          return;
        }

        const labelResult = await labelRes.json();

        // Update active Order with values returned from the actual backend
        const updatedOrder: RepairOrder = {
          ...activeOrder,
          status: 'AWAITING_SHIPMENT',
          escrowStatus: chargeResult.escrowStatus,
          escrowAmount: chargeResult.escrowAmount,
          trackingCodeInbound: labelResult.trackingCode,
          targetLocker: labelResult.destinationLocker, // Set the actual assigned service's Paczkomat!
          labelPdfUrl: labelResult.labelPdfUrl,
          updatedAt: new Date().toISOString()
        };

        onUpdateOrder(updatedOrder);

        // System notification
        onAddChatMessage({
          id: `sys-${Date.now()}`,
          orderId: activeOrder.id,
          sender: 'SYSTEM',
          text: `Dokonano zabezpieczenia środków w Stripe Escrow (kwota: 40 PLN, ID transakcji: ${chargeResult.transactionId}). InPost wygenerował bezetykietowy kod nadania: ${labelResult.lockerCodeSimulated} dla paczkomatu docelowego usługi: ${labelResult.destinationLocker} (${labelResult.receiverInfo.name}, ${labelResult.receiverInfo.address}). Nadaj paczkę w dowolnym Paczkomacie nadawczym.`,
          timestamp: new Date().toISOString(),
          isRead: false
        });

        onAddSystemLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Zabezpieczenie Depozytu',
          category: 'ESCROW',
          details: `Zabezpieczono 40.00 PLN depozytu przez Stripe. Platforma pobierze prowizję w kwocie ${chargeResult.breakdown.platformFee} PLN przy rozliczeniu. ID: ${chargeResult.transactionId}`,
          orderId: activeOrder.id
        });

      } else if (isPaying === 'REPAIR') {
        const finalCost = activeOrder.repairCost || 0;

        // Charge Repair Costs
        const chargeRes = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            amount: finalCost,
            paymentType: 'REPAIR',
            cardNumber,
            cardName
          })
        });

        if (!chargeRes.ok) {
          const errData = await chargeRes.json();
          alert(`Błąd płatności Stripe: ${errData.error || 'Nieznany błąd'}`);
          setStripeProcessing(false);
          return;
        }

        const chargeResult = await chargeRes.json();

        const updatedOrder: RepairOrder = {
          ...activeOrder,
          status: 'IN_REPAIR',
          escrowStatus: chargeResult.escrowStatus,
          escrowAmount: 40 + finalCost, // cumulative frozen
          updatedAt: new Date().toISOString()
        };

        onUpdateOrder(updatedOrder);

        onAddChatMessage({
          id: `sys-${Date.now()}`,
          orderId: activeOrder.id,
          sender: 'SYSTEM',
          text: `Pomyślnie zamrożono dodatkową płatność kosztów naprawy (${finalCost} PLN, ID transakcji: ${chargeResult.transactionId}). Łączna kwota depozytu Stripe Escrow wynosi ${40 + finalCost} PLN. Technik serwisowy został powiadomiony i przystępuje do naprawy Twojego sprzętu.`,
          timestamp: new Date().toISOString(),
          isRead: false
        });

        onAddSystemLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Zabezpieczenie Depozytu Naprawy',
          category: 'ESCROW',
          details: `Zabezpieczono dodatkowe ${finalCost}.00 PLN w safe box. Łączny depozyt: ${40 + finalCost} PLN. Docelowa prowizja Cortex (5%): ${chargeResult.breakdown.platformFee} PLN. ID: ${chargeResult.transactionId}`,
          orderId: activeOrder.id
        });
      }
    } catch (e) {
      console.error(e);
      alert('Błąd techniczny podczas łączenia się z bramką płatniczą Express + Stripe API.');
    } finally {
      setStripeProcessing(false);
      setIsPaying('NONE');
    }
  };

  // Safe InPost dropoff simulator inside client view
  const triggerInpostDropoff = () => {
    if (!activeOrder) return;

    const updatedOrder: RepairOrder = {
      ...activeOrder,
      status: 'IN_TRANSIT_TO_SERVICE',
      startLocker: lockerCode || 'KRA01N',
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updatedOrder);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Paczka została pomyślnie umieszczona w Paczkomacie nadawczym ${lockerCode || 'KRA01N'}. Status InPost: Gotowa do odebrania przez kuriera.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Zdarzenie Logistyczne InPost',
      category: 'LOGISTICS',
      details: `Klient nadał paczkę w Paczkomacie ${lockerCode || 'KRA01N'} bez etykiety. Kod zlecenia #${activeOrder.id}`,
      orderId: activeOrder.id
    });
  };

  // Confirm Delivery and Release Safe Escrow to Technical Center via actual Stripe settlement API
  const confirmAndReleaseFunds = async () => {
    if (!activeOrder) return;

    try {
      const settleRes = await fetch('/api/stripe/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          action: 'RELEASE',
          amount: activeOrder.escrowAmount,
          feePercent: 5
        })
      });

      if (!settleRes.ok) {
        const errData = await settleRes.json();
        alert(`Błąd podczas zwalniania depozytu: ${errData.error || 'Nieznany błąd'}`);
        return;
      }

      const settleResult = await settleRes.json();

      const updatedOrder: RepairOrder = {
        ...activeOrder,
        status: 'COMPLETED',
        escrowStatus: 'RELEASED',
        updatedAt: new Date().toISOString()
      };

      onUpdateOrder(updatedOrder);

      onAddChatMessage({
        id: `sys-${Date.now()}`,
        orderId: activeOrder.id,
        sender: 'SYSTEM',
        text: `Dziękujemy! Potwierdzono pomyślny odbiór sprawnego urządzenia. Stripe Connect dokonał rozliczenia depozytu (${activeOrder.escrowAmount} PLN) pod ID rozliczenia: ${settleResult.settlementId}. Prowizja platformy: ${settleResult.platformFee} PLN została pobrana, a kwota netto (${settleResult.netPayout} PLN) została przekazana na połączony rachunek bankowy warsztatu.`,
        timestamp: new Date().toISOString(),
        isRead: false
      });

      onAddSystemLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Zwolnienie Depozytu Escrow',
        category: 'ESCROW',
        details: `Rozliczono transakcję #${activeOrder.id} w Stripe. Settle ID: ${settleResult.settlementId}. Przekazano netto ${settleResult.netPayout} PLN dla serwisu, pobrano prowizję ${settleResult.platformFee} PLN.`,
        orderId: activeOrder.id
      });

      setIsRating(true);
    } catch (e) {
      console.error(e);
      alert('Błąd połączenia z modułem Stripe Connect podczas zwalniania depozytu.');
    }
  };

  // Open Dispute option to simulate Escrow protection
  const openDispute = () => {
    if (!activeOrder) return;

    const updatedOrder: RepairOrder = {
      ...activeOrder,
      status: 'DISPUTED',
      escrowStatus: 'DISPUTED',
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updatedOrder);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Uwaga: Klient otworzył spór dotyczący zlecenia #${activeOrder.id}. Środki zostały w pełni zablokowane w depozycie platformowym. Zostanie zorganizowane postępowanie mediacyjne ze strony administratora Cortex w celu wyjaśnienia uchybień.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Spór Transakcyjny',
      category: 'ESCROW',
      details: `Otwarto spór dla zlecenia #${activeOrder.id}. Kwota depozytu ${activeOrder.escrowAmount} PLN zablokowana do rozstrzygnięcia przez Admina.`,
      orderId: activeOrder.id
    });
  };

  // Execute chatbot messaging (Polish fallback + server-side Gemini completion)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeOrder || !activeService) return;

    const textToSend = newMessageText;
    setNewMessageText('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'CLIENT',
      text: textToSend,
      timestamp: new Date().toISOString(),
      isRead: true
    };

    onAddChatMessage(userMessage);
    setSendingChat(true);

    try {
      const response = await fetch('/api/chat-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Adrian Biber',
          deviceName: activeOrder.deviceName,
          category: activeOrder.category,
          description: activeOrder.description,
          status: activeOrder.status,
          serviceName: activeService.name,
          newMessage: textToSend,
          chatHistory: activeChats.concat(userMessage)
        })
      });

      const data = await response.json();

      const bMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        orderId: activeOrder.id,
        sender: 'SERVICE',
        text: data.reply,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      onAddChatMessage(bMessage);
    } catch (err) {
      console.error('Error contacting tech bot API:', err);
    } finally {
      setSendingChat(false);
    }
  };

  // Simple review submission form
  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!activeOrder) return;

    const updatedOrder: RepairOrder = {
      ...activeOrder,
      clientRating: rating,
      clientReview: comment,
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updatedOrder);

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Ocena Serwisu',
      category: 'COMMUNICATION',
      details: `Klient Adrian Biber ocenił serwis #${activeOrder.serviceProviderId} na ${rating} gwiazdek: "${comment}"`,
      orderId: activeOrder.id
    });

    setIsRating(false);
  };

  const getStatusPolishName = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 'Nowe Zgłoszenie';
      case 'AWAITING_SHIPMENT': return 'Oczekuje na wysyłkę';
      case 'IN_TRANSIT_TO_SERVICE': return 'W drodze do serwisu';
      case 'IN_DIAGNOSIS': return 'W diagnozie';
      case 'AWAITING_COST_APPROVAL': return 'Oczekuje na akceptację wyceny';
      case 'IN_REPAIR': return 'W trakcie naprawy';
      case 'TESTING_AND_REPORTING': return 'Testowanie i raportowanie';
      case 'RETURN_IN_TRANSIT': return 'Odesłane do klienta';
      case 'DELIVERED_AWAITING_CONFIRMATION': return 'Dostarczone (testy klienta)';
      case 'COMPLETED': return 'Zakończone';
      case 'DISPUTED': return 'Spór / Blokada depozytu';
      default: return status;
    }
  };

  const getStatusColorClass = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'AWAITING_SHIPMENT': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'IN_TRANSIT_TO_SERVICE': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'IN_DIAGNOSIS': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'AWAITING_COST_APPROVAL': return 'bg-blue-500/15 text-blue-400 border-blue-500/35 animate-pulse';
      case 'IN_REPAIR': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'TESTING_AND_REPORTING': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'RETURN_IN_TRANSIT': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'DELIVERED_AWAITING_CONFIRMATION': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse';
      case 'COMPLETED': return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'DISPUTED': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      default: return 'bg-slate-800 text-slate-450 border-slate-705';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="client-dashboard">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left pane: Active repairs index */}
        <div className="w-full lg:w-80 shrink-0" id="client-orders-sidebar">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                Moje Zgłoszenia ({orders.length})
              </h3>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 font-semibold text-xs text-cyan-400 cursor-pointer transition-all flex items-center gap-1 border border-cyan-500/15"
                id="btn-new-repair"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Nowe
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const srv = services.find(s => s.id === ord.serviceProviderId);
                return (
                  <div
                    key={ord.id}
                    onClick={() => { setSelectedOrderId(ord.id); setIsCreating(false); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedOrderId === ord.id
                        ? 'bg-slate-950 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {ord.deviceName}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        #{ord.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-450 truncate max-w-[110px]">
                        {srv ? srv.name : 'Serwis'}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusColorClass(ord.status)}`}>
                        {getStatusPolishName(ord.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right pane: Action Dashboard of selected order */}
        <div className="flex-1 min-w-0" id="client-order-workspace">
          {isCreating ? (
            /* Multi-step hardware submit form with Drag-Drop selection */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Nowe Zgłoszenie Serwisowe</h2>
                  <p className="text-xs text-slate-400 mt-1">Zgłoś usterkę urządzenia do wybranego warsztatu w Polsce.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-1 px-2 text-xs rounded bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
                >
                  Powrót
                </button>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Info fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Model urządzenia / Nazwa</label>
                      <input 
                        type="text"
                        placeholder="np. iPhone 13 Pro Max, PS5 Disc, Lenovo Yoga 9i"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Kategoria</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                        >
                          <option value="Smartfony">Smartfony</option>
                          <option value="Laptopy">Laptopy</option>
                          <option value="Konsole">Konsole</option>
                          <option value="Inne">Inne Elektronika</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Gwarancja serwisu</label>
                        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-cyan-400 font-mono flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Stripe Escrow
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Wybierz Specjalistę</label>
                      <select
                        value={newServiceId}
                        onChange={(e) => setNewServiceId(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.city}) - ⭐{s.rating}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Drag-and-drop Image Area */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Zdjęcie Urządzenia (Usterki)</label>
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all ${
                        dragActive ? 'border-cyan-400 bg-cyan-950/10' : 'border-slate-800 bg-slate-950/50'
                      }`}
                    >
                      {newImageFileUrl ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden group">
                          <img src={newImageFileUrl} alt="Attached damage" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewImageFileUrl(null)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/80 text-rose-450 border border-slate-800 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <Package className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-xs text-slate-300 text-center font-medium">Przeciągnij i upuść plik tutaj lub</span>
                          <label className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer">
                            wybierz z dysku
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Opis usterki i objawów</label>
                  <textarea
                    rows={4}
                    placeholder="Wpisz jak najwięcej szczegółów np. laptop wygasił się podczas gry, nie reaguje na guziki, czy słychać wentylator..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
                  >
                    Zarejestruj Zgłoszenie
                  </button>
                </div>
              </form>
            </div>
          ) : activeOrder ? (
            /* Selected Order Workspace */
            <div className="space-y-6" id="client-order-view">
              
              {/* Order Status Timeline Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Aktywne Zlecenie</span>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {activeOrder.deviceName} 
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getStatusColorClass(activeOrder.status)}`}>
                        {getStatusPolishName(activeOrder.status)}
                      </span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono block">Operator: <strong className="text-slate-200">{activeService?.name}</strong></span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: #{activeOrder.id} | Wykonano: {new Date(activeOrder.createdAt).toLocaleDateString('pl-PL')}</span>
                  </div>
                </div>

                {/* Vertical-Horizontal Timeline Nodes */}
                <div className="pt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className={`text-center p-2.5 rounded-xl border ${
                    activeOrder.status !== 'NEW' ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-slate-950 border-yellow-500/30'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-450 block">Krok 1</span>
                    <span className="text-xs font-bold text-white">Rejestracja</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Zadanie opisane</span>
                  </div>

                  <div className={`text-center p-2.5 rounded-xl border ${
                    ['NEW', 'AWAITING_SHIPMENT'].includes(activeOrder.status)
                      ? 'border-cyan-500/25 animate-pulse bg-cyan-950/10'
                      : ['IN_TRANSIT_TO_SERVICE','IN_DIAGNOSIS','AWAITING_COST_APPROVAL','IN_REPAIR','TESTING_AND_REPORTING','RETURN_IN_TRANSIT','DELIVERED_AWAITING_CONFIRMATION','COMPLETED'].includes(activeOrder.status)
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'border-slate-850 opacity-40'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-450 block">Krok 2</span>
                    <span className="text-xs font-bold text-white">Wysyłka InPost</span>
                    {activeOrder.status === 'NEW' ? (
                      <button 
                        onClick={() => setIsPaying('DIAGNOSIS')}
                        className="mt-1.5 w-full bg-yellow-500 text-slate-950 font-bold py-1 px-1 rounded text-[10px] cursor-pointer"
                      >
                        Zapłać 40 PLN
                      </button>
                    ) : (
                      <span className="text-[9px] text-cyan-400 font-mono block mt-1">
                        {activeOrder.trackingCodeInbound || 'Wygenerowany'}
                      </span>
                    )}
                  </div>

                  <div className={`text-center p-2.5 rounded-xl border ${
                    ['IN_TRANSIT_TO_SERVICE','IN_DIAGNOSIS'].includes(activeOrder.status)
                      ? 'border-indigo-500/30 animate-pulse bg-indigo-950/10'
                      : ['AWAITING_COST_APPROVAL','IN_REPAIR','TESTING_AND_REPORTING','RETURN_IN_TRANSIT','DELIVERED_AWAITING_CONFIRMATION','COMPLETED'].includes(activeOrder.status)
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'border-slate-850 opacity-40'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-450 block">Krok 3</span>
                    <span className="text-xs font-bold text-white">Diagnostyka</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Identyfikacja usterki</span>
                  </div>

                  <div className={`text-center p-2.5 rounded-xl border ${
                    activeOrder.status === 'AWAITING_COST_APPROVAL'
                      ? 'border-blue-500/55 animate-pulse bg-blue-950/20 shadow'
                      : ['IN_REPAIR','TESTING_AND_REPORTING','RETURN_IN_TRANSIT','DELIVERED_AWAITING_CONFIRMATION','COMPLETED'].includes(activeOrder.status)
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'border-slate-850 opacity-40'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-450 block">Krok 4</span>
                    <span className="text-xs font-bold text-white">Naprawa</span>
                    {activeOrder.status === 'AWAITING_COST_APPROVAL' ? (
                      <button 
                        onClick={() => setIsPaying('REPAIR')}
                        className="mt-1.5 w-full bg-blue-500 text-white font-bold py-1 px-1 rounded text-[10px] cursor-pointer"
                      >
                        Zatwierdź {activeOrder.repairCost} PLN
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-500 block mt-1">Realizacja techniczna</span>
                    )}
                  </div>

                  <div className={`text-center p-2.5 rounded-xl border ${
                    activeOrder.status === 'DELIVERED_AWAITING_CONFIRMATION'
                      ? 'border-emerald-500/55 animate-pulse bg-emerald-950/20'
                      : ['COMPLETED'].includes(activeOrder.status)
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'border-slate-850 opacity-40'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-450 block">Krok 5</span>
                    <span className="text-xs font-bold text-white">Odbiór</span>
                    {activeOrder.status === 'DELIVERED_AWAITING_CONFIRMATION' ? (
                      <button 
                        onClick={confirmAndReleaseFunds}
                        className="mt-1.5 w-full bg-emerald-500 text-slate-950 font-bold py-1 px-1 rounded text-[9px] cursor-pointer"
                      >
                        Test OK - Potwierdź
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-505 block mt-1">Zwolnienie depozytu</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Banner depending on active status */}
              {activeOrder.status === 'AWAITING_SHIPMENT' && (
                <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="flex gap-4 items-start col-span-2">
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 mt-1 shrink-0">
                      <Package className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">InPost Nadanie Bezetykietowe</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Płacenie diagnozy zakończone pomyślnie. Nie musisz drukować listów przewozowych! Zapakuj MacBooka, podejdź do Paczkomatu i wpisz kod na ekranie dotykowym lub zeskanuj kod paskowy.
                      </p>
                      <div className="flex gap-4 mt-3">
                        <span className="text-slate-300 text-xs">
                          Kod InPost: <strong className="font-mono text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400">
                            {activeOrder.trackingCodeInbound?.replace('INP-DIAG-', '') || '837129'}
                          </strong>
                        </span>
                        <span className="text-xs text-slate-300">
                          Paczkomat nadawczy: <span className="font-mono text-slate-400">KRA01N (lub zmień poniżej)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto shrink-0 flex flex-col gap-2 bg-slate-950/80 p-4 border border-slate-900 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Symulator Paczkomatu</span>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        placeholder="KRA01N"
                        value={lockerCode}
                        onChange={(e) => setLockerCode(e.target.value.toUpperCase())}
                        className="w-20 font-mono bg-slate-900 border border-slate-800 rounded p-1 text-xs text-center outline-none text-white focus:border-cyan-500/40"
                      />
                      <button
                        onClick={triggerInpostDropoff}
                        className="bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded cursor-pointer hover:bg-cyan-400 transition-all"
                      >
                        Nadaj Paczkę
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeOrder.status === 'DELIVERED_AWAITING_CONFIRMATION' && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
                  <div className="flex gap-4 items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Zwrócony sprzęt czeka na Twoją weryfikację!</h4>
                      <p className="text-xs text-slate-400">
                        Paczka zwrotna dotarła do Twojego wskazanego paczkomatu. Odbierz sprzęt, weź go do domu i dokładnie przetestuj. Środki w kwocie <strong className="text-amber-450">{activeOrder.escrowAmount} PLN</strong> są bezpiecznie zamrożone w banku w depozycie Stripe Escrow. Jeśli wszystko działa, kliknij zielony przycisk potwierdzenia zwalniający środki. Jeśli masz zastrzeżenia co do jakości lub sposobu naprawy, otwórz spór mediacyjny.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-850/30 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      onClick={openDispute}
                      className="px-4 py-2 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-950/20 transition-all cursor-pointer border border-rose-500/10"
                    >
                      Otwórz Spór / Reklamację
                    </button>
                    <button
                      onClick={confirmAndReleaseFunds}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Potwierdzam sprawność i zwalniam depozyt <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Workspace Split: Karta Informacyjna & Chat */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Details Sheet: Karta Informacyjna */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Karta Informacyjna Zlecenia
                    </h4>
                  </div>

                  <div className="space-y-4 text-xs text-slate-300">
                    <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-mono mb-0.5">Urządzenie:</span>
                        <span className="text-white font-semibold">{activeOrder.deviceName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-mono mb-0.5">Serwis Obsługujący:</span>
                        <span className="text-cyan-400 font-semibold">{activeService?.name}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-mono mb-1">Opis Usterki przez Klienta:</span>
                      <p className="bg-slate-950 p-3 rounded-lg text-slate-300 leading-relaxed border border-slate-900 italic">
                        "{activeOrder.description}"
                      </p>
                    </div>

                    {activeOrder.repairSummary && (
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-mono mb-1">Analiza Serwisanta & Wykonane Prace:</span>
                        <p className="bg-slate-950 p-3 rounded-lg text-slate-300 leading-relaxed border border-slate-900 border-l-2 border-l-cyan-500">
                          {activeOrder.repairSummary}
                        </p>
                      </div>
                    )}

                    {/* Financial Ledger matching specifications */}
                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-500 pb-1.5 border-b border-slate-900">
                        <span>Rejestr Finansowy</span>
                        <span className="text-cyan-400">Stripe Live Escrow</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450">Kaucja logistyczno-diagnostyczna:</span>
                        <span className="font-mono text-slate-200">40.00 PLN</span>
                      </div>
                      {activeOrder.repairCost && (
                        <div className="flex justify-between">
                          <span className="text-slate-450">Zatwierdzony koszt naprawy:</span>
                          <span className="font-mono text-slate-200">{activeOrder.repairCost}.00 PLN</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 border-t border-slate-900 font-bold text-white">
                        <span>Suma w Depozycie:</span>
                        <span className="font-mono text-amber-450">{activeOrder.escrowAmount}.00 PLN</span>
                      </div>
                      <div className="flex justify-between text-[10px] bg-slate-900/60 p-2 rounded border border-slate-850 text-slate-450 mt-1 font-mono">
                        <span>Stan depozytu:</span>
                        <span className="text-cyan-400 font-bold">
                          {activeOrder.escrowStatus === 'NONE' && 'Oczekuje na wpłatę'}
                          {activeOrder.escrowStatus === 'FROZEN_DIAGNOSIS' && 'Zabezpieczona diagnoza (40)'}
                          {activeOrder.escrowStatus === 'FROZEN_REPAIR' && 'Zabezpieczona naprawa pełna'}
                          {activeOrder.escrowStatus === 'RELEASED' && 'ZWOLNIONY - Przekazany serwisowi'}
                          {activeOrder.escrowStatus === 'REFUNDED' && 'ZWRÓCONY - Oddany klientowi'}
                          {activeOrder.escrowStatus === 'DISPUTED' && 'BLOKADA - Spór mediacyjny'}
                        </span>
                      </div>
                    </div>

                    {/* PDFs and uploads */}
                    {(activeOrder.labelPdfUrl || activeOrder.reportPdfUrl) && (
                      <div className="space-y-2">
                        <span className="text-slate-505 block text-[9px] uppercase font-mono">Dokumenty PDF do pobrania:</span>
                        <div className="flex flex-col gap-2">
                          {activeOrder.labelPdfUrl && (
                            <a 
                              href="#download" 
                              onClick={(e) => { e.preventDefault(); alert('Rozpoczęto generowanie i pobieranie bezetykietowego listu nadania InPost w formacie PDF (A6)...'); }}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-350 hover:text-white transition-all font-mono text-[10px]"
                            >
                              <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-cyan-400" /> Kod_Nadania_InPost_Cortex_{activeOrder.id}.pdf</span>
                              <span className="text-slate-500">22 KB</span>
                            </a>
                          )}
                          {activeOrder.reportPdfUrl && (
                            <a 
                              href="#download"
                              onClick={(e) => { e.preventDefault(); alert('Rozpoczęto pobieranie oficjalnego protokołu technicznego wykonania prac naprawczych (PDF) sygnowanego kluczem kryptograficznym Cortex...'); }}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-900 border-l-2 border-l-emerald-500 hover:border-slate-800 text-slate-350 hover:text-white transition-all font-mono text-[10px]"
                            >
                              <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-emerald-400" /> Protokol_Naprawy_Cortex_{activeOrder.id}.pdf</span>
                              <span className="text-slate-500">4 KB</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Czat Live with Technician */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[500px]" id="client-chats">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-405" />
                      <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                        Czat z Serwisantem #{activeOrder.id}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online
                    </span>
                  </div>

                  {/* Message stack */}
                  <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1 scrollbar-thin">
                    {activeChats.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'CLIENT' 
                            ? 'ml-auto items-end' 
                            : msg.sender === 'SYSTEM' 
                              ? 'mx-auto items-center w-full max-w-full'
                              : 'mr-auto items-start'
                        }`}
                      >
                        {msg.sender === 'SYSTEM' ? (
                          <div className="bg-slate-950/90 border border-slate-850 px-3 py-2 rounded-xl text-[10px] text-slate-400 text-center flex items-start gap-1.5 max-w-[90%] font-mono">
                            <AlertCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                            <span>{msg.text}</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[9px] font-mono text-slate-500 mb-0.5">
                              {msg.sender === 'CLIENT' ? 'Ty' : activeService?.name} | {new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'CLIENT'
                                ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                                : 'bg-slate-954 text-slate-200 border border-slate-850 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="flex flex-col items-start max-w-[80%] mr-auto">
                        <span className="text-[9px] font-mono text-slate-500 mb-0.5">Technik odpisuje...</span>
                        <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat write input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-850 pt-3 shrink-0">
                    <input 
                      type="text"
                      placeholder="Napisz do technika..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={sendingChat || activeOrder.status === 'COMPLETED'}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !newMessageText.trim() || activeOrder.status === 'COMPLETED'}
                      className="p-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-405 text-slate-950 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Package className="w-12 h-12 text-slate-650 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">Brak aktywnych zgłoszeń</h3>
              <p className="text-xs mb-6">Nie złożyłeś jeszcze żadnego zlecenia serwisowego lub nie posiadasz historii napraw.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mx-auto px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                id="btn-register-initial"
              >
                Let's Go! Dodaj Zgłoszenie <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STRIPE CHECKOUT MODAL SIMULATOR */}
      {isPaying !== 'NONE' && activeOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backup-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Cortex Secure Payment</h3>
              </div>
              <button 
                onClick={() => setIsPaying('NONE')}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-905 text-xs text-slate-355 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Szczegóły depozytu (Escrow)</div>
              <div className="flex justify-between">
                <span>Zlecenie:</span>
                <span className="text-white font-semibold">{activeOrder.deviceName}</span>
              </div>
              <div className="flex justify-between">
                <span>Warsztat docelowy:</span>
                <span className="text-white">{activeService?.name}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-900 font-bold text-white text-sm">
                <span>Do przelania do depozytu:</span>
                <span className="text-amber-450 font-mono">
                  {isPaying === 'DIAGNOSIS' ? '40.00 PLN' : `${activeOrder.repairCost}.00 PLN`}
                </span>
              </div>
            </div>

            {/* Credit Card Form Mockup */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Numer Karty Kredytowej</label>
                <input 
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Ważność</label>
                  <input 
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none text-center focus:border-cyan-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">CVV / CVC</label>
                  <input 
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none text-center focus:border-cyan-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Właściciel Karty</label>
                <input 
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded border border-slate-800 text-[10px] text-slate-450 leading-relaxed font-mono flex items-start gap-1.5">
              <Lock className="w-4 h-4 text-cyan-500 shrink-0" />
              Transakcja szyfrowana 256-bitowym kluczem TLS Secure. Pieniądze są wstrzymywane w banku depozytowym. Serwis nie otrzyma zapłaty, dopóki klient nie zatwierdzi odbioru sprawnego sprzętu.
            </div>

            <button
              onClick={executePayment}
              disabled={stripeProcessing}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-bold rounded-lg text-xs hover:from-cyan-400 hover:to-indigo-400 transition-all cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1 disabled:opacity-50"
              id="confirm-stripe-pay"
            >
              {stripeProcessing ? (
                <>Przetwarzanie w Stripe Connect...</>
              ) : (
                <>Zabezpiecz kaucję i utwórz depozyt</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RATING REVIEW SUBMIT MODAL */}
      {isRating && activeOrder && (
        <div className="fixed inset-0 bg-slate-950/85 backup-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-6">
            <div>
              <ThumbsUp className="w-10 h-10 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <h3 className="font-bold text-white text-base">Oceń jakość naprawy</h3>
              <p className="text-xs text-slate-400 mt-1">Poprawnie zwolniono depozyt Stripe Escrow. Podziel się opinią o {activeService?.name}.</p>
            </div>

            <RatingForm onReviewSubmit={handleReviewSubmit} />
          </div>
        </div>
      )}

    </div>
  );
}

// Inner helper Rating form representing state rating values
function RatingForm({ onReviewSubmit }: { onReviewSubmit: (rating: number, comment: string) => void }) {
  const [stars, setStars] = useState(5);
  const [commentText, setCommentText] = useState('');

  return (
    <div className="space-y-4 text-left">
      <div className="flex justify-center gap-2" id="rating-stars">
        {[1, 2, 3, 4, 5].map((st) => (
          <button
            key={st}
            onClick={() => setStars(st)}
            className="p-1 cursor-pointer transition-transform hover:scale-115 text-yellow-550"
          >
            <Star 
              className={`w-8 h-8 ${st <= stars ? 'text-amber-450 fill-amber-450' : 'text-slate-600'}`} 
            />
          </button>
        ))}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-2">Treść Opinii</label>
        <textarea
          rows={3}
          placeholder="np. Szybki kontakt, uratowali MacBooka po zalaniu, ekran działa rewelacyjnie! Bardzo polecam warsztat za profesjonalne mikrolutowanie."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
        />
      </div>

      <button
        onClick={() => onReviewSubmit(stars, commentText)}
        className="w-full py-2.5 bg-cyan-505 hover:bg-cyan-405 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-all uppercase tracking-wider"
      >
        Wyślij Opinię
      </button>
    </div>
  );
}
