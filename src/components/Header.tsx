/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Brain, User, Building2, ShieldCheck, Coins } from 'lucide-react';

interface HeaderProps {
  currentRole: 'landing' | 'client' | 'service' | 'admin';
  onChangeRole: (role: 'landing' | 'client' | 'service' | 'admin') => void;
  escrowTotal: number;
}

export default function Header({ currentRole, onChangeRole, escrowTotal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 shadow-xl" id="cortex-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onChangeRole('landing')}
            id="cortex-logo"
          >
            <div className="bg-gradient-to-tr from-cyan-400 to-indigo-500 p-2 rounded-xl text-slate-900 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <Brain className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                CorTex
              </span>
              <span className="hidden sm:inline bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase tracking-widest ml-2 px-1.5 py-0.5 rounded border border-cyan-500/20">
                Marketplace v2.6
              </span>
            </div>
          </div>

          {/* Role Navigation Controls */}
          <nav className="flex items-center gap-1.5 sm:gap-2" id="cortex-role-nav">
            <button
              onClick={() => onChangeRole('landing')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentRole === 'landing'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="hidden sm:inline">O platformie</span>
              <span className="sm:hidden">Start</span>
            </button>

            <button
              onClick={() => onChangeRole('client')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentRole === 'client'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              id="role-switch-client"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Panel Klienta</span>
              <span className="md:inline hidden sm:hidden">Klient</span>
              <span className="sm:hidden">Klient</span>
            </button>

            <button
              onClick={() => onChangeRole('service')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentRole === 'service'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              id="role-switch-service"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Panel Serwisu</span>
              <span className="md:inline hidden sm:hidden">Serwis</span>
              <span className="sm:hidden">Serwis</span>
            </button>

            <button
              onClick={() => onChangeRole('admin')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              id="role-switch-admin"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin</span>
              <span className="md:inline sm:hidden">Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </nav>

          {/* Quick Escrow Stats */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full" id="cortex-escrow-stat">
            <Coins className="w-4 h-4 text-amber-450 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Kapitał w depozycie:
            </span>
            <span className="text-sm font-semibold text-amber-400 font-mono">
              {escrowTotal} PLN
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
