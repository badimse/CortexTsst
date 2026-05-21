/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_SERVICES } from './src/mockData';

// Initialize dotenv if not run by tsx that auto-loads
import dotenv from 'dotenv';
dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Smart Technician chat bot
  app.post('/api/chat-bot', async (req, res) => {
    const {
      clientName,
      deviceName,
      category,
      description,
      status,
      serviceName,
      newMessage,
      chatHistory
    } = req.body;

    // Check if Gemini API is available
    const ai = getAiClient();

    if (ai) {
      try {
        const systemInstruction = `Jesteś profesjonalnym technikiem lub doradcą technicznym w polskim serwisie elektroniki "${serviceName}".
Klient "${clientName}" zgłosił do Was urządzenie "${deviceName}" (${category}) z opisem usterki: "${description}".
Aktualny stan zlecenia w systemie Cortex: "${status}".

Napisz krótką, rzeczową, profesjonalną i bardzo realistyczną odpowiedź techniczną na wiadomość klienta: "${newMessage}".
Zachowaj przyjazny, profesjonalny ton polskiego rzetelnego fachowca / inżyniera serwisowego. Unikaj przesadnie marketingowego, sztucznego lub lalkarskiego tonu i emojów (maksymalnie 1-2 emoji).
Wyjaśnij techniczne kwestie prosto i z szacunkiem. Odpisuj wyłącznie po polsku.`;

        const historyPrompt = Array.isArray(chatHistory) 
          ? chatHistory.slice(-6).map((msg: any) => `${msg.sender === 'CLIENT' ? 'Klient' : 'Serwis'}: ${msg.text}`).join('\n')
          : '';

        const fullPrompt = `${historyPrompt}\nKlient napisał właśnie: "${newMessage}"\nTwoja odpowiedź jako Technik ${serviceName}:`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        });

        const replyText = response.text?.trim() || 'Dziękuję za wiadomość. Przyjrzymy się sprawie i damy znać.';
        return res.json({ reply: replyText, isAi: true });
      } catch (err) {
        console.error('Gemini error, falling back to mock reply:', err);
      }
    }

    // Elegant rule-based fallback responses tailored to the order status
    let reply = 'Dziękujemy za kontakt. Nasi technicy przeanalizują Pana zapytanie i odpowiedzą najszybciej jak to możliwe.';
    const msgLower = (newMessage || '').toLowerCase();

    if (status === 'NEW' || status === 'AWAITING_SHIPMENT') {
      if (msgLower.includes('kod') || msgLower.includes('nadani') || msgLower.includes('paczkomat')) {
        reply = `Dzień dobry. Kod nadania InPost bezetykietowego pojawi się w Pana panelu zaraz po opłaceniu kosztów diagnozy i wysyłki (40 PLN). Środki te są bezpiecznie blokowane w depozycie Stripe Escrow. Po opłaceniu wystarczy udać się do Paczkomatu i wpisać wygenerowany kod na ekranie urządzenia.`;
      } else {
        reply = `Dzień dobry! Zgłoszenie dotyczące ${deviceName} zostało zarejestrowane w naszym systemie. Abyśmy mogli rozpocząć logistykę bezetykietową InPost i wygenerować kod nadania, prosimy o opłacenie standardowej kaucji diagnostycznej (40 PLN), która trafia do Stripe Escrow. Masz pytania dotyczące diagnozy? Śmiało pisz!`;
      }
    } else if (status === 'IN_DIAGNOSIS') {
      if (msgLower.includes('ile') || msgLower.includes('koszt') || msgLower.includes('kiedy') || msgLower.includes('diagnoz')) {
        reply = `Cześć! Urządzenie ${deviceName} jest obecnie na stole diagnostycznym. Nasz inżynier sprawdza napięcia i analizuje problem pod mikroskopem. Pełną wycenę wraz z kosztorysem części przedstawimy w ciągu 24 godzin – otrzyma Pan wtedy powiadomienie z opcją akceptacji kosztów w panelu.`;
      } else {
        reply = `Witaj! Potwierdzam, że urządzenie jest rozebrane i nasi specjaliści już nad nim pracują. Testujemy kluczowe moduły zasilania i magistrale komunikacyjne. Trzymaj rękę na pulsie, wkrótce przedstawimy precyzyjną kartę usterki.`;
      }
    } else if (status === 'AWAITING_COST_APPROVAL') {
      reply = `Zgłoszenie czeka na Twoją akceptację wyceny. Środki na naprawę są zamrażane w Stripe Escrow i zostaną wypłacone nam dopiero wtedy, gdy po odesłaniu przetestujesz sprzęt i potwierdzisz, że wszystko działa bez zarzutu. Jeśli masz wątpliwości co do wyceny, napisz do nas – chętnie wyjaśnimy, które komponenty wymagają wymiany.`;
    } else if (status === 'IN_REPAIR') {
      reply = `Środki zabezpieczone w depozycie, dziękujemy! Przystępujemy do właściwej naprawy ${deviceName}. Zamówiliśmy oryginalne części i przystępujemy do lutowania/wymiany wadliwych układów. Będziemy przesyłać aktualizacje na bieżąco.`;
    } else if (status === 'TESTING_AND_REPORTING') {
      reply = `Naprawa została zakończona sukcesem! Obecnie przeprowadzamy stress-testy obciążeniowe, aby upewnić się, że usterka nie powróci. Przygotowujemy również szczegółowy protokół naprawy PDF, który będzie do pobrania w Twoim panelu Cortex.`;
    } else if (status === 'RETURN_IN_TRANSIT' || status === 'DELIVERED_AWAITING_CONFIRMATION') {
      reply = `Sprzęt został bezpiecznie spakowany i nadany z powrotem do Twojego Paczkomatu docelowego. Prosimy o przetestowanie urządzenia po jego odbiorze i kliknięcie przycisku 'Potwierdź sprawność i zwolnij depozyt' w swoim panelu Cortex, co sfinalizuje transakcję w bezpieczny sposób.`;
    }

    res.json({ reply, isAi: false });
  });

  // Stripe API: Simulates Creating Payment Intent & Freezing Funds
  app.post('/api/stripe/payment-intent', (req, res) => {
    const { orderId, amount, paymentType, cardNumber, cardName } = req.body;

    if (!orderId || !amount || !paymentType) {
      return res.status(400).json({ error: 'Brakujące parametry płatności.' });
    }

    // Simulate card validation
    if (cardNumber && cardNumber.replace(/\s/g, '').length < 16) {
      return res.status(400).json({ error: 'Nieprawidłowy numer karty płatniczej.' });
    }

    const transactionId = 'ch_stripe_ref_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const escrowStatus = paymentType === 'DIAGNOSIS' ? 'FROZEN_DIAGNOSIS' : 'FROZEN_REPAIR';

    // Stripe Escrow splits
    const feePercent = 5; // standard 5% platform fee
    const platformFee = Number((amount * (feePercent / 100)).toFixed(2));
    const serviceShare = Number((amount - platformFee).toFixed(2));

    console.log(`[Stripe API] Payment registered for Order #${orderId}. ID: ${transactionId}. Frozen: ${amount} PLN.`);

    return res.json({
      success: true,
      transactionId,
      escrowStatus,
      escrowAmount: Number(amount),
      breakdown: {
        total: Number(amount),
        platformFee,
        serviceShare,
        currency: 'PLN'
      },
      message: `Płatność ${amount} PLN została pomyślnie zamrożona w depozycie platformy.`
    });
  });

  // InPost API: Generates non-labeled shipment codes and maps target service Paczkomat
  app.post('/api/inpost/generate-label', (req, res) => {
    const { orderId, serviceProviderId, startLocker, shipmentType } = req.body;

    if (!orderId || !serviceProviderId) {
      return res.status(400).json({ error: 'Brakujące parametry logistyczne InPost.' });
    }

    // Find service's Paczkomat
    const shop = INITIAL_SERVICES.find(s => s.id === Number(serviceProviderId));
    if (!shop) {
      return res.status(404).json({ error: 'Nie odnaleziono wybranego serwisu.' });
    }

    const serviceLocker = shop.inpostLockerId || 'POZ32M';
    const serviceAddress = shop.address || 'Poznań';
    const clientLocker = startLocker || 'KRA01N';

    const shipmentId = 'INP-CORTEX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const random6DigitCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`[InPost REST API] Created label for Order #${orderId} - Type: ${shipmentType}. Destination locker: ${serviceLocker}.`);

    return res.json({
      success: true,
      shipmentId,
      trackingCode: shipmentType === 'INBOUND' ? `INP-DIAG-${random6DigitCode}` : `INP-RTN-${random6DigitCode}`,
      lockerCodeSimulated: random6DigitCode,
      originLocker: shipmentType === 'INBOUND' ? clientLocker : serviceLocker,
      destinationLocker: shipmentType === 'INBOUND' ? serviceLocker : clientLocker,
      receiverInfo: {
        name: shop.name,
        address: serviceAddress
      },
      labelPdfUrl: `/labels/inpost_label_${orderId}.pdf`
    });
  });

  // Stripe API: Executes connected account payout releases or customer refunds
  app.post('/api/stripe/settle', (req, res) => {
    const { orderId, action, amount, feePercent } = req.body;

    if (!orderId || !action || !amount) {
      return res.status(400).json({ error: 'Brakujące parametry do rozliczenia Stripe.' });
    }

    const currentFeePercent = feePercent || 5;
    const platformFee = Number((amount * (currentFeePercent / 100)).toFixed(2));
    const netPayout = Number((amount - platformFee).toFixed(2));
    const settlementId = 'set_stripe_payout_' + Math.random().toString(36).substring(2, 11).toUpperCase();

    console.log(`[Stripe API] Escrow settled for Order #${orderId}. Action: ${action}. Platform fee collected: ${platformFee} PLN.`);

    return res.json({
      success: true,
      settlementId,
      action,
      totalAmount: Number(amount),
      platformFee: action === 'RELEASE' ? platformFee : 0,
      netPayout: action === 'RELEASE' ? netPayout : 0,
      refundedAmount: action === 'REFUND' ? Number(amount) : 0,
      recipient: action === 'RELEASE' ? 'SERVICE_PROVIDER_CONNECTED_ACCOUNT' : 'CLIENT_DEBIT_CARD',
      escrowStatus: action === 'RELEASE' ? 'RELEASED' : 'REFUNDED'
    });
  });

  // Serve static assets & Vite routing handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cortex Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
