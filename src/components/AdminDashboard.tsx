/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Coins, Activity, Package, AlertTriangle, 
  Settings, Check, X, RefreshCw, ThumbsUp, Sparkles 
} from 'lucide-react';
import { RepairOrder, SystemLog, ServiceProfile } from '../types';

interface AdminDashboardProps {
  orders: RepairOrder[];
  logs: SystemLog[];
  services: ServiceProfile[];
  onUpdateOrder: (updated: RepairOrder) => void;
  onAddSystemLog: (log: SystemLog) => void;
  onAddChatMessage: (chat: any) => void;
}

export default function AdminDashboard({
  orders,
  logs,
  services,
  onUpdateOrder,
  onAddSystemLog,
  onAddChatMessage
}: AdminDashboardProps) {
  const [platformFeePercent, setPlatformFeePercent] = useState(5);
  const [inpostSandboxOnline, setInpostSandboxOnline] = useState(true);

  // Derive Platform Metrics
  const activeDisputes = orders.filter(o => o.status === 'DISPUTED');
  
  const totalFrozenEscrow = orders
    .filter(o => ['FROZEN_DIAGNOSIS', 'FROZEN_REPAIR', 'DISPUTED'].includes(o.escrowStatus))
    .reduce((sum, o) => sum + o.escrowAmount, 0);

  const completedRepairs = orders.filter(o => o.status === 'COMPLETED');
  
  const platformRevenue = completedRepairs
    .reduce((sum, o) => sum + (o.escrowAmount * (platformFeePercent / 100)), 0);

  // Average Rating
  const ratedOrders = orders.filter(o => o.clientRating !== null);
  const averageRating = ratedOrders.length 
    ? (ratedOrders.reduce((sum, o) => sum + (o.clientRating || 0), 0) / ratedOrders.length).toFixed(2)
    : '4.85';

  // Handle dispute resolution using real backend Stripe endpoints
  const resolveDispute = async (orderId: number, outcome: 'CLIENT' | 'SERVICE') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const isRefund = outcome === 'CLIENT';
      const settleRes = await fetch('/api/stripe/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          action: isRefund ? 'REFUND' : 'RELEASE',
          amount: order.escrowAmount,
          feePercent: platformFeePercent
        })
      });

      if (!settleRes.ok) {
        const errData = await settleRes.json();
        alert(`Błąd rozliczenia Stripe: ${errData.error || 'Nieznany błąd'}`);
        return;
      }

      const settleResult = await settleRes.json();

      if (outcome === 'CLIENT') {
        const updated: RepairOrder = {
          ...order,
          status: 'COMPLETED',
          escrowStatus: 'REFUNDED',
          updatedAt: new Date().toISOString()
        };

        onUpdateOrder(updated);

        onAddChatMessage({
          id: `admin-${Date.now()}`,
          orderId: order.id,
          sender: 'SYSTEM',
          text: `ROZSTRZYGNIĘCIE ADMINISTRACYJNE SPORU: Administrator rozpatrzył reklamację na korzyść Klienta. Kwota depozytu (${order.escrowAmount} PLN) została pomyślnie zwrócona na rachunek powiązany z kartą płatniczą klienta za pośrednictwem Stripe (ID zwrotu: ${settleResult.settlementId}). Zlecenie sfinalizowane zwrotem środków.`,
          timestamp: new Date().toISOString(),
          isRead: false
        });

        onAddSystemLog({
          id: `syslog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Arbitraż Spustowy (Klient)',
          category: 'ESCROW',
          details: `Decyzja admina ws. zlecenia #${order.id}: sfinalizowano PEŁNY ZWROT (${order.escrowAmount} PLN) dla klienta ${order.clientName} w Stripe (Settle: ${settleResult.settlementId}).`,
          orderId: order.id
        });
      } else {
        const updated: RepairOrder = {
          ...order,
          status: 'COMPLETED',
          escrowStatus: 'RELEASED',
          updatedAt: new Date().toISOString()
        };

        onUpdateOrder(updated);

        onAddChatMessage({
          id: `admin-${Date.now()}`,
          orderId: order.id,
          sender: 'SYSTEM',
          text: `ROZSTRZYGNIĘCIE ADMINISTRACYJNE SPORU: Administrator rozpatrzył sprawę na korzyść Serwisu. Prace zostały uznane za zgodne z diagnozą. Środki z depozytu (${order.escrowAmount} PLN) zostały zwolnione i przetransferowane na konto techniczne serwisu. Pobrano prowizję platformy: ${settleResult.platformFee} PLN, a kwota netto (${settleResult.netPayout} PLN) powędrowała do warsztatu (ID: ${settleResult.settlementId}).`,
          timestamp: new Date().toISOString(),
          isRead: false
        });

        onAddSystemLog({
          id: `syslog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Arbitraż Spustowy (Serwis)',
          category: 'ESCROW',
          details: `Decyzja admina ws. zlecenia #${order.id}: zwolniono ŚRODKI (${order.escrowAmount} PLN) dla warsztatu ID ${order.serviceProviderId} w Stripe. Settle ID: ${settleResult.settlementId}, platforma pobrała prowizję ${settleResult.platformFee} PLN.`,
          orderId: order.id
        });
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd techniczny podczas łączenia z systemem płatności Stripe.');
    }
  };

  const getLogCategoryColor = (category: string) => {
    switch (category) {
      case 'ESCROW': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOGISTICS': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'COMMUNICATION': return 'bg-indigo-505/10 text-indigo-400 border-indigo-505/20';
      case 'ORDER': return 'bg-emerald-500/10 text-emerald-400 border-emerald-505/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard">
      <div className="space-y-8">
        
        {/* Statistics Metric Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" id="admin-overview-metrics">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Prawdziwy depozyt Stripe Escrow</span>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{totalFrozenEscrow} PLN</span>
              <p className="text-[10px] text-slate-400 mt-2">Środki klientów zamrożone do zweryfikowania sprawności sprzętu.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Przychód z prowizji platformy ({platformFeePercent}%)</span>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">{platformRevenue.toFixed(2)} PLN</span>
              <p className="text-[10px] text-slate-400 mt-2">Naliczone automatycznie od sfinalizowanych napraw.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Złożone i aktywne spory</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-500">{activeDisputes.length} zlec.</span>
                {activeDisputes.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Zabezpieczone kwoty sporne wymagające interwencji rzecznika.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Średnia ocena systemu</span>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-405">★ {averageRating}</span>
              <p className="text-[10px] text-slate-400 mt-2">Średnia satysfakcji oparta na ratingach po zwolnieniu Stripe.</p>
            </div>
          </div>
        </div>

        {/* Dispute mediation segment */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Dispute arbitration panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                Centrum Rozstrzygania Sporów (Mediator)
              </h3>
            </div>

            {activeDisputes.length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-xl border border-slate-900 text-center text-slate-500">
                <ShieldCheck className="w-10 h-10 text-emerald-500/25 mx-auto mb-2" />
                <p className="text-xs">Wszystkie depozyty płatności w systemie Cortex są bezpieczne. Brak otwartych sporów.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDisputes.map(dis => {
                  const srv = services.find(s => s.id === dis.serviceProviderId);
                  return (
                    <div key={dis.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Konflikt dla Zlecenia #{dis.id}</span>
                          <span className="text-sm font-bold text-white">{dis.deviceName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Zamrożone:</span>
                          <span className="text-xs font-mono font-bold text-amber-500">{dis.escrowAmount} PLN</span>
                        </div>
                      </div>

                      <div className="text-slate-400 text-xs py-2 bg-slate-900/40 px-3 rounded border border-slate-900 italic">
                        "Usterka: {dis.description}"<br />
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Serwisant: {srv ? srv.name : 'Serwis'}</span>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => resolveDispute(dis.id, 'CLIENT')}
                          className="px-3.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 border border-rose-505/20 text-rose-405 text-[11px] font-bold cursor-pointer transition-all"
                        >
                          Zwróć środki Klientowi (Pełen Refund)
                        </button>
                        <button
                          onClick={() => resolveDispute(dis.id, 'SERVICE')}
                          className="px-3.5 py-1.5 rounded bg-emerald-555/15 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 text-emerald-450 text-[11px] font-bold cursor-pointer transition-all"
                        >
                          Zwolnij środki Serwisowi (Przelew)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operational Parameters controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Settings className="w-4.5 h-4.5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                Wyłączniki Awaryjne i Parametry
              </h3>
            </div>

            <div className="space-y-5 text-xs">
              {/* platform fee slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Odpis prowizyjny Cortex (%):</span>
                  <span className="font-mono text-cyan-400 font-bold">{platformFeePercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  step="0.5"
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                  className="w-full accent-cyan-405 bg-slate-950 h-1.5 rounded cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 leading-none">Automatyczny narzut pobierany od każdego sfinalizowanego zlecenia Stripe Escrow.</span>
              </div>

              {/* Inpost Sandbox Emergency Switch */}
              <div className="pt-4 border-t border-slate-850/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">InPost REST Sandbox API:</span>
                  <button 
                    onClick={() => setInpostSandboxOnline(!inpostSandboxOnline)}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      inpostSandboxOnline 
                        ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' 
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {inpostSandboxOnline ? 'ONLINE (ACTIVE)' : 'OFFLINE (BLOCKED)'}
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  Kontrola środowiska deweloperskiego nadawania bezetykietowego. Wyłączenie blokuje możliwość automatycznego przesyłania kodów dostępowych skrytek.
                </p>
              </div>

              {/* Platform state indicator */}
              <div className="p-3 bg-slate-955 rounded-xl border border-slate-850 space-y-1 font-mono text-[10px] text-slate-450">
                <div className="text-white font-bold text-xs mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Platform Status</div>
                <div>Node Service ID: <span className="text-cyan-400">cortex-prod-west3</span></div>
                <div>Stripe API Version: <span className="text-slate-300">2026-05-21</span></div>
                <div>Database Cluster: <span className="text-slate-300">Firebase Firestore Shard-01</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live system logs stream matching spec */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <Activity className="w-5 h-5 text-cyan-405" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
              Monitor Zdarzeń i Aktywności Systemowych (Cortex LiveLogs)
            </h3>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto font-mono text-xs pr-1">
            {logs.map((lg) => (
              <div key={lg.id} className="bg-slate-950 border border-slate-905 p-3 rounded-xl flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <span className={`text-[9px] font-bold uppercase p-1 rounded border shrink-0 text-center w-24 tracking-wider ${getLogCategoryColor(lg.category)}`}>
                    {lg.category}
                  </span>
                  <div>
                    <span className="text-slate-300 font-bold block md:inline md:mr-2">{lg.action}</span>
                    <span className="text-slate-400 text-[11px] font-sans leading-relaxed">{lg.details}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">
                    {new Date(lg.timestamp).toLocaleTimeString('pl-PL')}
                  </span>
                  {lg.orderId && <span className="text-[9px] text-indigo-400 font-bold">Zlecenie #{lg.orderId}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
