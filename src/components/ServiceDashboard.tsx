/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Package, Star, MessageSquare, Send, CheckCircle2, 
  MapPin, Coins, FileText, Image, ChevronRight, AlertCircle, RefreshCw 
} from 'lucide-react';
import { ServiceProfile, RepairOrder, ChatMessage, SystemLog, OrderStatus, EscrowStatus } from '../types';

interface ServiceDashboardProps {
  orders: RepairOrder[];
  services: ServiceProfile[];
  chats: ChatMessage[];
  onUpdateOrder: (updated: RepairOrder) => void;
  onAddChatMessage: (chat: ChatMessage) => void;
  onAddSystemLog: (log: SystemLog) => void;
}

export default function ServiceDashboard({
  orders,
  services,
  chats,
  onUpdateOrder,
  onAddChatMessage,
  onAddSystemLog
}: ServiceDashboardProps) {
  // Switched active service shop so the user can test different shops
  const [activeShopId, setActiveShopId] = useState<number>(services[0]?.id || 1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Diagnosis wycena inputs
  const [proposedCost, setProposedCost] = useState('250');
  const [techDiagnosisText, setTechDiagnosisText] = useState('');

  // Repair completions inputs
  const [repairSummary, setRepairSummary] = useState('');
  const [sampleAfterPhoto, setSampleAfterPhoto] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop');

  // Chat message input
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto select appropriate order when changing shops
  const shopOrders = orders.filter(o => o.serviceProviderId === activeShopId);
  const activeShop = services.find(s => s.id === activeShopId);

  useEffect(() => {
    if (shopOrders.length > 0) {
      // Keep previous order selected if it belongs to this shop, otherwise select the first one
      const exists = shopOrders.find(o => o.id === selectedOrderId);
      if (!exists) {
        setSelectedOrderId(shopOrders[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [activeShopId, orders]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedOrderId]);

  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const activeChats = chats.filter(c => c.orderId === selectedOrderId);

  // Handle Send Chat on Service behalf
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeOrder || !activeShop) return;

    const myMsg: ChatMessage = {
      id: `srv-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SERVICE',
      text: newMessageText,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    onAddChatMessage(myMsg);
    setNewMessageText('');

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Wiadomość z Serwisu',
      category: 'COMMUNICATION',
      details: `Serwis ${activeShop.name} wysłał wiadomość do klienta ${activeOrder.clientName}.`,
      orderId: activeOrder.id
    });
  };

  // Workflow: Dropoff picked up from lockers to inspection
  const handlePickupFromLocker = () => {
    if (!activeOrder || !activeShop) return;

    const updated: RepairOrder = {
      ...activeOrder,
      status: 'IN_DIAGNOSIS',
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updated);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Serwisant odebrał Twoje urządzenie z Paczkomatu docelowego i przetransportował je do warsztatu. Status zlecenia: Rozpoczęto diagnostykę urządzenia.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Odbiór z Paczkomatu',
      category: 'LOGISTICS',
      details: `Serwisant odebrał paczkę ze skrzynki docelowej InPost. Zlecenie #${activeOrder.id} przechodzi w stan IN_DIAGNOSIS.`,
      orderId: activeOrder.id
    });
  };

  // Workflow: Submit proposed diagnosis budget
  const handleSubmitWycena = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !activeShop || !proposedCost || !techDiagnosisText) return;

    const updated: RepairOrder = {
      ...activeOrder,
      status: 'AWAITING_COST_APPROVAL',
      repairCost: Number(proposedCost),
      repairSummary: techDiagnosisText,
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updated);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Serwisant zakończył diagnozę urządzenia. Koszt prac wyceniono na: ${proposedCost} PLN. Karta diagnozy: "${techDiagnosisText}". Zaakceptuj wycenę, aby przelać środki do bezpiecznego depozytu Stripe Escrow.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Przedłożenie Wyceny',
      category: 'ORDER',
      details: `Zaproponowano wycenę ${proposedCost} PLN dla zlecenia #${activeOrder.id}. Raport diagnostyczny: "${techDiagnosisText}"`,
      orderId: activeOrder.id
    });

    // Reset inputs
    setTechDiagnosisText('');
  };

  // Workflow: Move from IN_REPAIR to testing
  const handleMoveToTesting = () => {
    if (!activeOrder) return;

    const updated: RepairOrder = {
      ...activeOrder,
      status: 'TESTING_AND_REPORTING',
      updatedAt: new Date().toISOString()
    };
    onUpdateOrder(updated);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Prace lutownicze / wymiana komponentów zakończone! Log: MacBook przechodzi obecnie stres-testy zasilania i obciążenia karty graficznej.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Zakończenie Prac',
      category: 'ORDER',
      details: `Prace montażowe dla zlecenia #${activeOrder.id} ukończone. Rozpoczęto fazę testów stabilności.`,
      orderId: activeOrder.id
    });
  };

  // Workflow: Send back (Return transit via InPost using real backend API)
  const handleReturnDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !repairSummary) return;

    try {
      const labelRes = await fetch('/api/inpost/generate-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          serviceProviderId: activeOrder.serviceProviderId,
          startLocker: activeOrder.startLocker || 'WAW14A',
          shipmentType: 'OUTBOUND'
        })
      });

      if (!labelRes.ok) {
        const errData = await labelRes.json();
        alert(`Błąd logistyki InPost przy generowaniu powrotu: ${errData.error || 'Nieznany błąd'}`);
        return;
      }

      const labelResult = await labelRes.json();

      const updated: RepairOrder = {
        ...activeOrder,
        status: 'RETURN_IN_TRANSIT',
        imageAfterUrl: sampleAfterPhoto,
        repairSummary: repairSummary,
        reportPdfUrl: `/reports/cortex_raport_${activeOrder.id}.pdf`,
        trackingCodeOutbound: labelResult.trackingCode,
        updatedAt: new Date().toISOString()
      };

      onUpdateOrder(updated);

      onAddChatMessage({
        id: `sys-${Date.now()}`,
        orderId: activeOrder.id,
        sender: 'SYSTEM',
        text: `Urządzenie przeszło pomyślnie testy obciążeniowe. Serwis wydał certyfikowany raport końcowy PDF i odesłał sprzęt z powrotem. InPost wygenerował zwrotny bezetykietowy list przewozowy: ${labelResult.trackingCode} (Skrytka nadawcza: ${labelResult.originLocker} -> Skrytka odbiorcza: ${labelResult.destinationLocker}).`,
        timestamp: new Date().toISOString(),
        isRead: false
      });

      onAddSystemLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Odesłanie do Klienta',
        category: 'LOGISTICS',
        details: `Serwis wydał i nadał paczkę zwrotną w InPost o numerze ${labelResult.trackingCode}. Sposób dostawy: Paczkomat ${labelResult.originLocker} do ${labelResult.destinationLocker}.`,
        orderId: activeOrder.id
      });

      // reset fields
      setRepairSummary('');
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas łączenia się z modułem InPost API.');
    }
  };

  // Dev Quick-Helper: Deliver from transit to customer locker (uses accurate student locker code)
  const handleSimulateDelivery = () => {
    if (!activeOrder) return;

    const finalClientLocker = activeOrder.startLocker || 'WAW14A';

    const updated: RepairOrder = {
      ...activeOrder,
      status: 'DELIVERED_AWAITING_CONFIRMATION',
      targetLocker: finalClientLocker,
      updatedAt: new Date().toISOString()
    };

    onUpdateOrder(updated);

    onAddChatMessage({
      id: `sys-${Date.now()}`,
      orderId: activeOrder.id,
      sender: 'SYSTEM',
      text: `Status InPost: Paczka zwrotna została dostarczona do Twojego Paczkomatu odbiorczego ${finalClientLocker}. Odbierz sprzęt ze skrytki, przetestuj jego działanie i zatwierdź sprawność w panelu, aby zwolnić bezpieczny depozyt.`,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    onAddSystemLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Dostarczenie InPost',
      category: 'LOGISTICS',
      details: `Paczka zwrotna dla zlecenia #${activeOrder.id} dostarczona przez kuriera do docelowej skrytki klienta ${finalClientLocker}.`,
      orderId: activeOrder.id
    });
  };

  const getStatusPolishName = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 'Nowe Zgłoszenie';
      case 'AWAITING_SHIPMENT': return 'Aczekuje na nadanie';
      case 'IN_TRANSIT_TO_SERVICE': return 'W drodze do serwisu';
      case 'IN_DIAGNOSIS': return 'W diagnozie';
      case 'AWAITING_COST_APPROVAL': return 'Wysłano wycenę (Oczekuje)';
      case 'IN_REPAIR': return 'W naprawie';
      case 'TESTING_AND_REPORTING': return 'Testowanie i Raportowanie';
      case 'RETURN_IN_TRANSIT': return 'Odesłane (Tranzyt)';
      case 'DELIVERED_AWAITING_CONFIRMATION': return 'Dostarczone u klienta';
      case 'COMPLETED': return 'Zakończone (Final)';
      case 'DISPUTED': return 'Zablokowane (Spór)';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="service-dashboard">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left pane: Workshops switch & assigned orders list */}
        <div className="w-full lg:w-80 shrink-0 space-y-6" id="service-operator-bar">
          {/* Active Operator Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Zarządzaj Warsztatem jako:</span>
            <div className="flex items-center gap-3 mt-1.5 p-2 bg-slate-950 rounded-xl border border-slate-850">
              <div className="p-2 mr-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <select
                value={activeShopId}
                onChange={(e) => setActiveShopId(Number(e.target.value))}
                className="flex-1 bg-transparent text-sm font-bold text-white outline-none"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {activeShop && (
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-450 mt-3 pt-2.5 border-t border-slate-900/60">
                <span>Ocena: ⭐{activeShop.rating}</span>
                <span>Zrealizowano: {activeShop.completedCount}</span>
              </div>
            )}
          </div>

          {/* Assigned active orders list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono mb-3">
              Przypisane Naprawy ({shopOrders.length})
            </h3>
            {shopOrders.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Brak zleceń przypisanych do tego serwisu.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {shopOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedOrderId === ord.id
                        ? 'bg-slate-950 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">{ord.deviceName}</span>
                      <span className="text-[9px] font-mono text-slate-500">#{ord.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-450 truncate max-w-[110px]">{ord.clientName}</span>
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Action console of selected order */}
        <div className="flex-1 min-w-0" id="service-order-workspace">
          {activeOrder ? (
            <div className="space-y-6">
              
              {/* Active Header card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-wider">Obsługa aktywnego zlecenia</span>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {activeOrder.deviceName}
                    <span className="text-xs px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-405 font-mono">
                      {getStatusPolishName(activeOrder.status)}
                    </span>
                  </h2>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-left text-xs font-mono">
                  <div className="flex justify-between gap-6 text-slate-500 uppercase text-[9px]">
                    <span>Depozyt Stripe:</span>
                    <span className="text-amber-450 font-bold">{activeOrder.escrowAmount} PLN</span>
                  </div>
                  <div className="flex justify-between gap-6 text-slate-500 uppercase text-[9px] mt-1">
                    <span>Stan Escrow:</span>
                    <span className="text-slate-300 font-bold">{activeOrder.escrowStatus}</span>
                  </div>
                </div>
              </div>

              {/* TECHNICIAN WORKFLOW MANAGER PANEL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                    Konsola Decyzyjna Technika
                  </h3>
                </div>

                {activeOrder.status === 'IN_TRANSIT_TO_SERVICE' && (
                  <div className="bg-indigo-950/20 border border-indigo-500/25 p-5 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-400" /> Paczka InPost dotarła do Twojego Paczkomatu ({activeOrder.targetLocker || 'POZ32M'})!
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Klient umieścił sprzęt w Paczkomacie nadawczym. Paczka kurierska została dostarczona do Twojego przypisanego punktu w wyznaczonym terminie. Odbierz paczkę, rozpakuj w strefie wolnej od kurzu i przenieś stan zlecenia do diagnostyki inżynierskiej.
                    </p>
                    <button
                      onClick={handlePickupFromLocker}
                      className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/10 inline-flex items-center gap-1.5"
                    >
                      Odbierz z Paczkomatu i Rozpocznij Diagnozę <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeOrder.status === 'IN_DIAGNOSIS' && (
                  <form onSubmit={handleSubmitWycena} className="space-y-4 bg-slate-950 border border-slate-850 p-5 rounded-xl">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Formularz Raportu Diagnostycznego i Budżetu
                    </h4>
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Przeanalizowałeś problem na płycie głównej pod mikroskopem? Przedstaw powód usterki, konieczne części do wymiany i opisz zakres naprawy. Klient otrzyma powiadomienie na żywo w celu akceptacji i zasilenia Stripe Escrow.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Oszacowany Koszt Naprawy (PLN)</label>
                        <input 
                          type="number" 
                          value={proposedCost}
                          onChange={(e) => setProposedCost(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-white outline-none focus:border-indigo-500/40"
                          required
                          min="10"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kaucja diagnozy</label>
                        <div className="w-full bg-slate-900/40 p-2 text-xs font-mono text-slate-500 rounded border border-slate-800">
                          Zabezpieczone 40 PLN kaucji
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Wstępny raport usterki</label>
                      <textarea
                        rows={3}
                        placeholder="np. Wykryto zwarcie w linii zasilania regulatora TPS51980 na płycie głównej. Konieczna wymiana dławika i klucza tranzystorowego SMD oraz pełna hydrofobowa konserwacja."
                        value={techDiagnosisText}
                        onChange={(e) => setTechDiagnosisText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-250 outline-none focus:border-indigo-500/40"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1"
                    >
                      Prześlij wycenę i raport do Klienta <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {activeOrder.status === 'IN_REPAIR' && (
                  <div className="bg-indigo-950/10 border border-indigo-500/20 p-5 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Naprawa opłacona - przystąp do pracy!
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Klient zaakceptował wycenę i pomyślnie sfinalizował depozyt. Kwota <strong className="text-white">{activeOrder.escrowAmount} PLN</strong> jest bezpiecznie zamrożona. Przeprowadź właściwe mikrolutowanie, wymianę części lub instalację oprogramowania.
                    </p>
                    <button
                      onClick={handleMoveToTesting}
                      className="px-5 py-2.5 bg-emerald-550 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Zakończ Naprawę i Przejdź do Testów Obciążeniowych <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeOrder.status === 'TESTING_AND_REPORTING' && (
                  <form onSubmit={handleReturnDispatch} className="space-y-4 bg-slate-950 border border-slate-850 p-5 rounded-xl">
                    <h4 className="text-sm font-bold text-emerald-450 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Przekazanie Końcowe & Logistyka InPost Zwrotna
                    </h4>
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Zakończono stress-testy obciążenia. Przedstaw ostateczny opis wykonanych prac naprawczych i opcjonalnie wklej URL zdjęcia sprawnie działającego sprzętu po naprawie jako dowód pomyślności. System wygeneruje automatyczną etykietę zwrotną.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Ostateczny opis naprawy (Protokół PDF)</label>
                      <textarea
                        rows={3}
                        placeholder="Zalutowano nowy tranzystor MOSFET, przetestowano ładowanie napięciem 20V/3A. Komputer przechodzi testy stabilności trwające 4 godziny pod pełnym poborem mocy..."
                        value={repairSummary}
                        onChange={(e) => setRepairSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Zdjęcie Sprzętu Po Naprawie (URL podglądu)</label>
                      <input 
                        type="text"
                        value={sampleAfterPhoto}
                        onChange={(e) => setSampleAfterPhoto(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-350 outline-none focus:border-indigo-500/40 font-mono"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-slate-500 font-mono">Generowany PDF: Protokol_Naprawy_{activeOrder.id}.pdf</span>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1"
                      >
                        Wydaj Sprzęt i Wyślij Z powrotem <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {activeOrder.status === 'RETURN_IN_TRANSIT' && (
                  <div className="bg-slate-950 p-5 rounded-xl space-y-3 border border-slate-850">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-500" /> Logistyka Tranzytowa InPost (Wycofanie)
                    </h4>
                    <p className="text-xs text-slate-450">
                      Sprzęt został przekazany kurierowi InPost. Wygenerowano zwrotny kod i paczka jest obecnie w drodze do paczkomatu klienta. Jako administrator/serwisant możesz natychmiast wrzucić paczkę do docelowej skrzynki klienta, by ten dokonał końcowych testów i zwolnił depozyt.
                    </p>
                    <button
                      onClick={handleSimulateDelivery}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Dostarcz paczkę do Paczkomatu klienta (Symulacja Kuriera)
                    </button>
                  </div>
                )}

                {['NEW', 'AWAITING_SHIPMENT', 'DELIVERED_AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED'].includes(activeOrder.status) && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs text-slate-500 flex items-start gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Zlecenie w stanie {activeOrder.status}. Brak natychmiastowych działań po stronie serwisu. Oczekuj na reakcję klienta na panelu lub rozmawiaj bezpośrednio na czacie.</span>
                  </div>
                )}
              </div>

              {/* Workflow split: Device inspection & chat */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Visual inspection parameters */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                    <Image className="w-4 h-4 text-indigo-405" />
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Weryfikacja Wizualna Sprzętu
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {activeOrder.imageBeforeUrl && (
                      <div>
                        <span className="text-xs text-slate-550 block mb-1 font-mono font-medium">1. Przed naprawą (Klient):</span>
                        <div className="h-40 rounded-xl overflow-hidden border border-slate-850">
                          <img src={activeOrder.imageBeforeUrl} alt="Device damage" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {activeOrder.imageAfterUrl ? (
                      <div>
                        <span className="text-xs text-emerald-400 block mb-1 font-mono font-medium">2. Po naprawie (Ukończono):</span>
                        <div className="h-40 rounded-xl overflow-hidden border border-emerald-900/40">
                          <img src={activeOrder.imageAfterUrl} alt="Device repair finished" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-850 rounded-xl h-40 flex flex-col items-center justify-center p-2 text-slate-600">
                        <span className="text-[10px] font-mono">Oczekiwanie na zdjęcie zakończenia prac usterki</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-905 text-xs text-slate-350 space-y-1 bg-gradient-to-tr from-slate-950 to-indigo-950/25">
                    <div className="font-bold text-white text-xs mb-1">Dane Zgłaszającego</div>
                    <div>Imię i Nazwisko: <strong className="text-slate-205">{activeOrder.clientName}</strong></div>
                    <div>Adres e-mail: <span className="font-mono text-slate-400">{activeOrder.clientEmail}</span></div>
                    {activeOrder.startLocker && (
                      <div className="mt-1 pb-1">Wybrany Paczkomat Startowy: <span className="font-mono text-indigo-400 bg-indigo-505/10 px-1 rounded">{activeOrder.startLocker}</span></div>
                    )}
                  </div>
                </div>

                {/* Service Chat workspace */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[450px]" id="service-chat">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                        Czat z Klientem #{activeOrder.id}
                      </h4>
                    </div>
                  </div>

                  {/* Message scroll */}
                  <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1 scrollbar-thin">
                    {activeChats.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'SERVICE' 
                            ? 'ml-auto items-end' 
                            : msg.sender === 'SYSTEM' 
                              ? 'mx-auto items-center w-full max-w-full'
                              : 'mr-auto items-start'
                        }`}
                      >
                        {msg.sender === 'SYSTEM' ? (
                          <div className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl text-[10px] text-slate-500 text-center flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3 h-3 text-cyan-400" />
                            <span>{msg.text}</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[9px] font-mono text-slate-505 mb-0.5">
                              {msg.sender === 'SERVICE' ? 'Serwis (Wy)' : activeOrder.clientName} | {new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'SERVICE'
                                ? 'bg-indigo-500 text-white font-medium rounded-tr-none'
                                : 'bg-slate-950 text-slate-205 border border-slate-850 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message write */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-850 pt-3 shrink-0">
                    <input 
                      type="text"
                      placeholder="Napisz do klienta..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="p-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-405 text-white disabled:opacity-45 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 text-slate-650 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">Wybierz zgłoszenie</h3>
              <p className="text-xs">Kliknij na dowolną przypisaną naprawę po lewej stronie, aby załadować interaktywną konsolę inżynieryjną i zarządzać procedurą.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
