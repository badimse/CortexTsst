/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import ClientDashboard from './components/ClientDashboard';
import ServiceDashboard from './components/ServiceDashboard';
import AdminDashboard from './components/AdminDashboard';
import { RepairOrder, ChatMessage, SystemLog } from './types';
import { INITIAL_ORDERS, INITIAL_SERVICES, INITIAL_CHAT, INITIAL_LOGS } from './mockData';

export default function App() {
  const [role, setRole] = useState<'landing' | 'client' | 'service' | 'admin'>('landing');

  // React state arrays loaded from localStorage or initialized with realistic defaults
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Load state on mount
  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('cortex_orders');
      const storedChats = localStorage.getItem('cortex_chats');
      const storedLogs = localStorage.getItem('cortex_logs');

      if (storedOrders) setOrders(JSON.parse(storedOrders));
      else {
        setOrders(INITIAL_ORDERS);
        localStorage.setItem('cortex_orders', JSON.stringify(INITIAL_ORDERS));
      }

      if (storedChats) setChats(JSON.parse(storedChats));
      else {
        setChats(INITIAL_CHAT);
        localStorage.setItem('cortex_chats', JSON.stringify(INITIAL_CHAT));
      }

      if (storedLogs) setLogs(JSON.parse(storedLogs));
      else {
        setLogs(INITIAL_LOGS);
        localStorage.setItem('cortex_logs', JSON.stringify(INITIAL_LOGS));
      }
    } catch (e) {
      console.error('Error loading local storage state', e);
      setOrders(INITIAL_ORDERS);
      setChats(INITIAL_CHAT);
      setLogs(INITIAL_LOGS);
    }
  }, []);

  // Sync state helpers
  const handleAddOrder = (newOrder: RepairOrder, initialMessage: string) => {
    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    localStorage.setItem('cortex_orders', JSON.stringify(nextOrders));

    // Add initial system message
    const sysMsg: ChatMessage = {
      id: `sys-init-${Date.now()}`,
      orderId: newOrder.id,
      sender: 'SYSTEM',
      text: initialMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const nextChats = [...chats, sysMsg];
    setChats(nextChats);
    localStorage.setItem('cortex_chats', JSON.stringify(nextChats));

    // Log the event
    const newLog: SystemLog = {
      id: `log-reg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Nowe Zgłoszenie',
      category: 'ORDER',
      details: `Klient Adrian Biber zgłosił urządzenie ${newOrder.deviceName} (id #${newOrder.id})`,
      orderId: newOrder.id
    };

    const nextLogs = [newLog, ...logs];
    setLogs(nextLogs);
    localStorage.setItem('cortex_logs', JSON.stringify(nextLogs));
  };

  const handleUpdateOrder = (updated: RepairOrder) => {
    const nextOrders = orders.map(o => o.id === updated.id ? updated : o);
    setOrders(nextOrders);
    localStorage.setItem('cortex_orders', JSON.stringify(nextOrders));
  };

  const handleAddChatMessage = (chat: ChatMessage) => {
    const nextChats = [...chats, chat];
    setChats(nextChats);
    localStorage.setItem('cortex_chats', JSON.stringify(nextChats));
  };

  const handleAddSystemLog = (log: SystemLog) => {
    const nextLogs = [log, ...logs];
    setLogs(nextLogs);
    localStorage.setItem('cortex_logs', JSON.stringify(nextLogs));
  };

  // Switch role and preselect preferred service shop if routed from landing
  const handleJoinAsClient = (selectedServiceId?: number) => {
    setRole('client');
    if (selectedServiceId) {
      // System notification logic can go here. Client enters client workspace.
      console.log('Joined client with service preference ID:', selectedServiceId);
    }
  };

  // Calculate live totals for Header Display
  const currentEscrowTotal = orders
    .filter(o => ['FROZEN_DIAGNOSIS', 'FROZEN_REPAIR', 'DISPUTED'].includes(o.escrowStatus))
    .reduce((val, o) => val + o.escrowAmount, 0);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Platform Header */}
      <Header 
        currentRole={role} 
        onChangeRole={(r) => setRole(r)} 
        escrowTotal={currentEscrowTotal}
      />

      {/* Main workspace mapping depending on selected role */}
      <main className="flex-1 bg-gradient-to-b from-[#0b0f19] to-[#070a13]">
        {role === 'landing' && (
          <LandingView 
            onJoinAsClient={handleJoinAsClient} 
            onJoinAsService={() => setRole('service')} 
          />
        )}

        {role === 'client' && (
          <ClientDashboard 
            orders={orders}
            services={INITIAL_SERVICES}
            chats={chats}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onAddChatMessage={handleAddChatMessage}
            onAddSystemLog={handleAddSystemLog}
          />
        )}

        {role === 'service' && (
          <ServiceDashboard 
            orders={orders}
            services={INITIAL_SERVICES}
            chats={chats}
            onUpdateOrder={handleUpdateOrder}
            onAddChatMessage={handleAddChatMessage}
            onAddSystemLog={handleAddSystemLog}
          />
        )}

        {role === 'admin' && (
          <AdminDashboard 
            orders={orders}
            logs={logs}
            services={INITIAL_SERVICES}
            onUpdateOrder={handleUpdateOrder}
            onAddSystemLog={handleAddSystemLog}
            onAddChatMessage={handleAddChatMessage}
          />
        )}
      </main>

    </div>
  );
}
