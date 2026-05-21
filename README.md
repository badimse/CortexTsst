# Cortex – Safe Repair Escrow & InPost Logistics Hub

Cortex to dedykowany system klasy SaaS przeznaczony do kompleksowego zarządzania procesem serwisowym urządzeń elektronicznych. Platforma całkowicie eliminuje brak zaufania między klientem a serwisem poprzez zastosowanie dwuetapowego depozytu **Stripe Escrow** oraz bezetykietowej integracji z siecią automatów paczkowych **InPost**.

Aplikacja wspiera pełen cykl życia zlecenia: od pierwszej wyceny kaucji diagnostycznej, przez nadanie urządzenia, mikroskopię i diagnostykę inżynierską, po końcową akceptację kosztów naprawy, odesłanie sprawnego sprzętu i automatyczne rozliczenie środków.

---

## 🚀 Główne Założenia Biznesowe i Techniczne

1. **Bezpieczeństwo Środków (Stripe Escrow):**
   * **Kaucja Diagnostyczna:** Klient zamraża 40 PLN w bezpiecznym depozycie platformy, aby pokryć logistykę oraz czas inżyniera potrzebny na diagnostykę.
   * **Depozyt Naprawy:** Po diagnozie serwisant proponuje wycenę. Zamrożenie tej kwoty przez klienta daje serwisowi zielone światło na lutowanie / zamawianie części, gwarantując wypłacalność klienta.
   * **Inteligentne Rozliczenie:** Środki trafiają na konto podłączone serwisu (**Stripe Connect**) dopiero po fizycznym potwierdzeniu przez klienta, że odebrany sprzęt jest sprawny. W przypadku konfliktu, wbudowany moduł arbitrażu administratora pozwala na podział środków lub pełen refund.

2. **Logistyka Bezetykietowa (InPost API):**
   * Pełna automatyzacja na podstawie dwukierunkowych parametrów REST API.
   * Klient otrzymuje **6-cyfrowy kod nadania** bezpośrednio w aplikacji i otwiera skrytkę bez konieczności drukowania tradycyjnej etykiety.
   * System automatycznie mapuje punkt docelowy pod konkretny adres fizyczny oraz ID Paczkomatu wybranego serwisu (np. `POZ32M`, `WAW01C`).
   * **Logistyka Zwrotna:** Po udanej naprawie i testach, serwis generuje powrotny list przewozowy, a platforma śledzi aktualną pozycję przesyłki kurierskiej.

---

## 📂 Architektura & Struktura Projektu

Projekt działa w architekturze **Full-Stack (Vite + React + Express)**. Wszystkie wrażliwe operacje finansowe i logistyczne są proxy-owane przez dedykowane, bezpieczne API serwerowe, co zapobiega wyciekowi kluczy API do przeglądarki klienta.

```
├── server.ts                 # Serwer Express.js (Mock Stripe Connect, InPost REST API)
├── package.json              # Skrypty budowania, zależności oraz startu produkcyjnego
├── metadata.json             # Metadane i uprawnienia platformy Google AI Studio
├── src/
│   ├── main.tsx              # Główny punkt wejścia React
│   ├── App.tsx               # Root Component - Zarządzanie stanem globalnym i rolami
│   ├── types.ts              # Definicje interfejsów TypeScript (Order, Service, Chat, Logs)
│   ├── mockData.ts           # Dane startowe dla warsztatów i początkowych zleceń
│   ├── index.css             # Import Tailwind CSS v4, konfiguracja fontów i custom style
│   └── components/
│       ├── Header.tsx           # Pasek nawigacji, aktualny bilans depozytu i zmiana ról
│       ├── LandingView.tsx      # Landing page z interaktywną listą dostępnych serwisów
│       ├── ClientDashboard.tsx  # Panel klienta (opłacanie kaucji, InPost, dysputy)
│       ├── ServiceDashboard.tsx # Panel technika (wycena, raporty PDF, symulacja kuriera)
│       └── AdminDashboard.tsx   # Panel arbitrażu, parametry prowizji, event monitor
```

---

## 🛠️ Instrukcja Instalacji i Uruchomienia Lokalnego

Wszystkie procedury kompilacji oraz wymagane zależności są gotowe do uruchomienia zarówno w kontenerze developerskim, jak i na Twojej własnej maszynie deweloperskiej.

### Wymagania wstępne:
* **Node.js** (zalecana wersja v18 lub nowsza)
* **npm** (lub yarn / pnpm)

### Krok po kroku:

1. **Klonowanie i instalacja pakietów:**
   ```bash
   npm install
   ```

2. **Konfiguracja środowiska:**
   Skopiuj `.env.example` do `.env` i uzupełnij klucze integracyjne dla środowisk produkcyjnych (Stripe API, InPost API, Firebase):
   ```bash
   cp .env.example .env
   ```

3. **Uruchomienie serwera deweloperskiego (HMR + Express Backend):**
   ```bash
   npm run dev
   ```
   Serwer uruchomi się na porcie **3000** pod adresem `http://localhost:3000`.

4. **Budowanie produkcyjne aplikacji:**
   ```bash
   npm run build
   ```
   Skompilowana wersja aplikacji klienckiej zostanie umieszczona w folderze `dist`, a serwer backendowy zostanie spakowany za pomocą `esbuild` do jednego zoptymalizowanego pliku CommonJS `dist/server.cjs`.

5. **Start produkcyjny:**
   ```bash
   npm run start
   ```

---

## 🔒 Bezpieczeństwo i Integracje Produkcyjne

Podczas wdrażania na serwer produkcyjny VPS zaleca się zamianę metod symulacyjnych w `server.ts` na rzeczywiste wywołania SDK:

* **Stripe Node SDK:** Zastąp endpoint `/api/stripe/payment-intent` wywołaniem `stripe.paymentIntents.create({ capture_method: 'manual', ... })` dla blokady środków na karcie deweloperskiej lub klienta. Do rozliczeń i transferów na konta podłączone wykorzystaj `stripe.transfers.create(...)` uwzględniając pobraną prowizję platformy (`application_fee_amount`).
* **InPost ShipX API:** Zintegruj `/api/inpost/generate-label` z oficjalnym integratorem InPost ShipX (wersja v1 REST). Do tworzenia przesyłek bezetykietowych (InPost paczkomat-paczkomat) wykorzystaj akcję `/v1/shipments` przekazując odpowiednie punkty logistyczne `receiver.address.locker_id` wyciągnięte bezpośrednio z bazy danych wybranego warsztatu.
