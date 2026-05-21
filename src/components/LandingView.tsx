/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Package, Lock, Star, Cpu, MessageSquare, 
  ArrowRight, ShieldCheck, Mail, Building2, Check, X 
} from 'lucide-react';
import { INITIAL_SERVICES } from '../mockData';
import { ServiceProfile } from '../types';

interface LandingViewProps {
  onJoinAsClient: (serviceId?: number) => void;
  onJoinAsService: () => void;
}

export default function LandingView({ onJoinAsClient, onJoinAsService }: LandingViewProps) {
  return (
    <div className="bg-[#0b0f19] text-slate-100 min-h-screen" id="landing-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-900" id="landing-hero">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_55%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium tracking-wider mb-6">
            <Lock className="w-3.5 h-3.5" /> Bezpieczeństwo finansowe z InPost i Stripe Escrow
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none mb-6">
            Twoje Cyfrowe Centrum Napraw.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              Bez wychodzenia z domu.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Jedyny w Polsce dwustronny portal łączący Cię ze sprawdzonymi ekspertami. Naprawiaj urządzenia wysyłkowo ze 100% gwarancją bezpieczeństwa i przejrzystości finansowej.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onJoinAsClient()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-all cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 hover:scale-[1.02]"
              id="cta-client-start"
            >
              Zgłoś naprawę w 60s <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onJoinAsService}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 font-semibold hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
              id="cta-service-start"
            >
              Chcę przyjmować zlecenia <Building2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Fast Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="landing-stats">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between">
            <div className="bg-cyan-500/10 p-2.5 rounded-lg w-fit text-cyan-400 mb-4">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">100% Zdalnie</h3>
              <p className="text-xs text-slate-400">Obsługa bezetykietowa InPost. Nadajesz i odbierasz w Paczkomacie bez drukowania.</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between">
            <div className="bg-indigo-500/10 p-2.5 rounded-lg w-fit text-indigo-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Stripe Escrow</h3>
              <p className="text-xs text-slate-400">Wypłata dla serwisu następuje dopiero po Twoim ostatecznym przetestowaniu i akceptacji sprzętu.</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between">
            <div className="bg-emerald-500/10 p-2.5 rounded-lg w-fit text-emerald-450 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Cała Polska</h3>
              <p className="text-xs text-slate-400">Dostęp do wyselekcjonowanej krajowej elity inżynierów i serwisantów elektroniki bga/smd.</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between">
            <div className="bg-amber-500/10 p-2.5 rounded-lg w-fit text-amber-450 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Raporty PDF</h3>
              <p className="text-xs text-slate-400">Automatyczny generator protokołów naprawczych stanowiący rzetelną dokumentację i gwarancję.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Traditional vs Cortex */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-950" id="landing-benefits">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
            Masz dość szukania fachowców w okolicy?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Nie ograniczaj się do serwisów w Twoim sąsiedztwie. Twoje urządzenie wymaga wiedzy specjalisty? Zajmiemy się logistyką.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional */}
          <div className="bg-slate-950/50 p-8 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-500/10 text-rose-400 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-rose-400">Tradycyjny Serwis Lokalny</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 mt-1">●</span>
                Ograniczony wybór fachowców na poziomie lokalnym
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 mt-1">●</span>
                Brak rzetelnego podglądu procesu naprawy na bieżąco
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 mt-1">●</span>
                Ryzyko naciągania na nagłe koszty bez formalnej zgody
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 mt-1">●</span>
                Konieczność osobistego zawożenia i stania w kolejkach
              </li>
            </ul>
          </div>

          {/* Cortex Ecosystem */}
          <div className="bg-slate-900/40 p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/35 transition-all shadow-xl shadow-cyan-950/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyan-500/10 text-cyan-400 p-2 rounded-lg">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400">Ogólnokrajowy Ekosystem Cortex</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-300 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 mt-1">✓</span>
                Dostęp do ściśle zweryfikowanej elity serwisantów w całej Polsce
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 mt-1">✓</span>
                Automatyczna logistyka InPost bez konieczności drukowania etykiet
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 mt-1">✓</span>
                Czat live bezpośrednio z technikiem wykonującym naprawę
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 mt-1">✓</span>
                Stripe Escrow: Bezpieczne deponowanie pieniędzy chroniące Twoje finanse
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4 Simple Steps */}
      <section className="bg-slate-950/40 py-20 border-y border-slate-950" id="landing-how0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-4">
              Naprawa w 4 prostych krokach
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Zaprojektowany od zera prosty i bezpieczny schemat wysyłkowy bez zbędnej biurokracji.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <span className="absolute -top-6 -left-2 text-7xl font-black text-slate-900 leading-none">01</span>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">1. Opisujesz Usterkę</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Wypełniasz intuicyjny formularz, wskazujesz model sprzętu, dołączasz ewentualne zdjęcia i wybierasz preferowany warsztat.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -top-6 -left-2 text-7xl font-black text-slate-900 leading-none">02</span>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">2. Depozyt & Paczkomat</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Zabezpieczasz 40 PLN kaucji diagnostycznej w Stripe. Otrzymujesz na telefon kod bezetykietowy i zostawiasz paczkę w Paczkomacie.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -top-6 -left-2 text-7xl font-black text-slate-900 leading-none">03</span>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">3. Diagnoza & Czat Live</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Technik bada sprzęt i proponuje wycenę. Rozmawiasz bezpośrednio na czacie. Akceptujesz koszt naprawy jednym kliknięciem.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -top-6 -left-2 text-7xl font-black text-slate-900 leading-none">04</span>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">4. Odbiór & Rozliczenie</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Naprawiony sprzęt wraca do Ciebie. Odbierasz, testujesz, potwierdzasz sukces. Środki zostają przekazane dla serwisu!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stripe Escrow Deep Dive */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="landing-escrow-trust">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 rounded-3xl p-8 sm:p-12 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Gwarancja Ochrony Środków
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Zaufanie chronione przez Stripe Escrow
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Wiemy, że wysyłka drogiego laptopa i przedpłaty bywa stresująca. Dlatego stworzyliśmy system depozytowy (Escrow) obsługiwany przez technologię Stripe.
              Twoje pieniądze są bezpiecznie zamrożone podczas trwania naprawy. Serwis nie otrzyma zapłaty, dopóki odesłany sprzęt nie zostanie przez Ciebie sprawdzony.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <span className="text-cyan-400 text-xs font-mono block mb-1">Dla Klienta:</span>
                <span className="text-xs text-slate-400">Zero ryzyka straty pieniędzy w przypadku partackiej roboty lub braku naprawy.</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <span className="text-indigo-400 text-xs font-mono block mb-1">Dla Serwisu:</span>
                <span className="text-xs text-slate-400">Gwarancja wypłacalności i brak użerania się z klientem odmawiającym zapłaty po robocie.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl w-full lg:max-w-md shadow-2xl relative">
            <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded">
              Zaufany Status
            </div>
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Wizualny Schemat Depozytowy</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs ring-1 ring-cyan-500/20">K1</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Klient opłaca diagnozę / koszty</h5>
                  <p className="text-[10px] text-slate-400">Środki lądują w module depozytowym Stripe</p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-slate-800 ml-4" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs ring-1 ring-indigo-500/20">S2</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Serwis realizuje zgłoszenie i wysyła</h5>
                  <p className="text-[10px] text-slate-400">Pieniądze pozostają bezpiecznie zablokowane</p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-slate-800 ml-4" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs ring-1 ring-emerald-500/20">A3</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Zwolnienie środków dla serwisu</h5>
                  <p className="text-[10px] text-slate-400">Tylko po ostatecznym potwierdzeniu sprawności urządzenia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-950" id="landing-services">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-4">
            Najlepiej oceniane serwisy w kraju
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Wybierz certyfikowanego rzetelnego partnera z najwyższą renomą i zgłoś komputer, telefon lub konsolę.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_SERVICES.map((service) => (
            <div 
              key={service.id} 
              className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/50 transition-all shadow-md group"
            >
              <div>
                <span className="inline-block bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/20 mb-3">
                  {service.badge}
                </span>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                  {service.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono tracking-wide block mb-3">
                  Paczkomat: {service.city}
                </span>
                <p className="text-xs text-slate-450 leading-relaxed min-h-[72px]">
                  {service.description}
                </p>
                <div className="text-[11px] font-mono text-slate-400 mt-4">
                  <span className="text-emerald-400 font-bold">✓</span> {service.specialization}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-4 h-4 text-amber-450 fill-amber-450" />
                  <span className="text-white font-bold">{service.rating}</span>
                  <span className="text-slate-500 font-mono">({service.completedCount})</span>
                </div>
                <button
                  onClick={() => onJoinAsClient(service.id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-slate-950"
                >
                  Zgłoś sprzęt <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 px-4 border-t border-slate-900" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-xs">
          <div>
            <span className="font-bold text-white text-sm">Cortex Marketplace</span>
            <p className="mt-1">© 2026 Cortex Ecosystem Polska. Wszelkie prawa zastrzeżone.</p>
          </div>
          <div className="flex gap-4">
            <a href="#how" className="hover:text-cyan-400 transition-colors">Regulamin platformy</a>
            <a href="#sec" className="hover:text-cyan-400 transition-colors">Polityka prywatności</a>
            <a href="#api" className="hover:text-cyan-400 transition-colors">API InPost</a>
            <a href="#stripe" className="hover:text-cyan-400 transition-colors">Dokumentacja Stripe</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
