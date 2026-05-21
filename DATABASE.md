# Cortex – Dokumentacja Struktury Bazy Danych

Aby wdrożyć platformę Cortex na własnym serwerze produkcyjnym VPS, konieczne jest odwzorowanie stanów i modeli danych zdefiniowanych w aplikacji. Poniższa dokumentacja techniczo-architektoniczna przedstawia schemat bazy danych w dwóch najpopularniejszych standardach: **Relacyjnym (np. PostgreSQL / MySQL)** oraz **Dokumentowym (np. Firebase Firestore / MongoDB)**.

---

## 🗺️ Schemat Relacji Encji (ERD - ASCII)

```
  +----------------------+             +----------------------+
  |       SERVICES       |             |        CLIENTS       |
  +----------------------+             +----------------------+
  | PK  id               |             | PK  id (UUID)        |
  |     name             |             |     email (unique)   |
  |     description      |             |     full_name        |
  |     rating           |             |     created_at       |
  |     completed_count  |             +-----------+----------+
  |     badge            |                         |
  |     inpost_locker_id |                         |
  |     address          |                         | 1
  +----------+-----------+                         |
             |                                     |
             | 1                                   |
             |                                     |
             | N                                   | N
  +----------v-------------------------------------v----------+
  |                        REPAIR_ORDERS                      |
  +-----------------------------------------------------------+
  | PK  id (Int / Series)                                     |
  | FK  service_provider_id --------> SERVICES(id)            |
  |     client_name                                           |
  |     client_email                                          |
  |     device_name                                           |
  |     description                                           |
  |     image_before_url                                      |
  |     image_after_url                                       |
  |     status (OrderStatus ENUM)                             |
  |     repair_cost (Decimal)                                 |
  |     repair_summary (Text)                                 |
  |     start_locker (Varchar)                                |
  |     target_locker (Varchar)                               |
  |     tracking_code_inbound (Varchar)                       |
  |     tracking_code_outbound (Varchar)                      |
  |     label_pdf_url (Varchar)                               |
  |     report_pdf_url (Varchar)                              |
  |     escrow_amount (Decimal)                               |
  |     escrow_status (EscrowStatus ENUM)                     |
  |     client_rating (SmallInt)                              |
  |     client_review (Text)                                  |
  |     created_at (Timestamp)                                |
  |     updated_at (Timestamp)                                |
  +----------+------------------------------------------------+
             |
             | 1
             |
             +-----------------------+
             | N                     | N
  +----------v-----------+     +-----v----------------+
  |     CHAT_MESSAGES    |     |      SYSTEM_LOGS     |
  +----------------------+     +----------------------+
  | PK  id (UUID)        |     | PK  id (UUID)        |
  | FK  order_id         |     | FK  order_id         |
  |     sender (Enum)    |     |     timestamp        |
  |     text (Text)      |     |     action           |
  |     timestamp        |     |     category (Enum)  |
  |     is_read (Bool)   |     |     details          |
  +----------------------+     +----------------------+
```

---

## 1. Relacyjna Baza Danych (PostgreSQL DDL)

Poniższy skrypt SQL zawiera kompletne definicje tabel, typów wyliczeniowych (ENUM) oraz niezbędnych kluczy obcych i indeksów usprawniających wyszukiwanie przesyłek InPost oraz transakcji Stripe.

```sql
-- 1. Tworzenie typów wyliczeniowych dla statusów zlecenia i depozytu escrow
CREATE TYPE order_status_type AS ENUM (
  'NEW',
  'AWAITING_SHIPMENT',
  'IN_TRANSIT_TO_SERVICE',
  'IN_DIAGNOSIS',
  'AWAITING_COST_APPROVAL',
  'IN_REPAIR',
  'TESTING_AND_REPORTING',
  'RETURN_IN_TRANSIT',
  'DELIVERED_AWAITING_CONFIRMATION',
  'COMPLETED',
  'DISPUTED'
);

CREATE TYPE escrow_status_type AS ENUM (
  'UNPAID',
  'FROZEN_DIAGNOSIS',
  'FROZEN_REPAIR',
  'RELEASED',
  'REFUNDED'
);

CREATE TYPE sender_role_type AS ENUM (
  'CLIENT',
  'SERVICE',
  'SYSTEM'
);

CREATE TYPE log_category_type AS ENUM (
  'ORDER',
  'ESCROW',
  'LOGISTICS',
  'COMMUNICATION'
);

-- 2. Tabela Serwisów / Warsztatów Partnerów
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  completed_count INTEGER DEFAULT 0,
  badge VARCHAR(100),
  inpost_locker_id VARCHAR(12) NOT NULL, -- przypisany Paczkomat docelowy serwisu
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela Zleceń Napraw (Główny rejestr platformy)
CREATE TABLE repair_orders (
  id SERIAL PRIMARY KEY,
  service_provider_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_name VARCHAR(150) NOT NULL,
  client_email VARCHAR(150) NOT NULL,
  device_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_before_url TEXT,
  image_after_url TEXT,
  
  -- Statusy procesów
  status order_status_type DEFAULT 'NEW'::order_status_type,
  
  -- Wymiary finansowe
  repair_cost DECIMAL(10, 2) DEFAULT 0.00,
  repair_summary TEXT,
  
  -- Dane Logistyczne InPost
  start_locker VARCHAR(12),  -- Paczkomat nadawcy (klienta)
  target_locker VARCHAR(12), -- Paczkomat docelowy (serwisu lub zwrotny)
  tracking_code_inbound VARCHAR(50),
  tracking_code_outbound VARCHAR(50),
  label_pdf_url TEXT,
  report_pdf_url TEXT,
  
  -- Zarządzanie Depozytem Stripe
  escrow_amount DECIMAL(10, 2) DEFAULT 0.00,
  escrow_status escrow_status_type DEFAULT 'UNPAID'::escrow_status_type,
  
  -- Ocena pozwoleniowa
  client_rating SMALLINT CHECK (client_rating >= 1 AND client_rating <= 5),
  client_review TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela historii wiadomości na czacie wsparcia zlecenia
CREATE TABLE chat_messages (
  id VARCHAR(50) PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  sender sender_role_type NOT NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Monitor LiveLogs dla administratora
CREATE TABLE system_logs (
  id VARCHAR(50) PRIMARY KEY,
  order_id INTEGER REFERENCES repair_orders(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  action VARCHAR(100) NOT NULL,
  category log_category_type NOT NULL,
  details TEXT NOT NULL
);

-- Indeksy przyspieszające najczęstsze zapytania do bazy danych
CREATE INDEX idx_orders_service_provider_id ON repair_orders (service_provider_id);
CREATE INDEX idx_orders_status ON repair_orders (status);
CREATE INDEX idx_orders_tracking_inbound ON repair_orders (tracking_code_inbound);
CREATE INDEX idx_orders_tracking_outbound ON repair_orders (tracking_code_outbound);
CREATE INDEX idx_messages_order_id ON chat_messages (order_id);
CREATE INDEX idx_logs_order_id ON system_logs (order_id);
```

---

## 2. Model Bezrelacyjny (NoSQL - Firebase Firestore)

W przypadku architektury opartej o Firebase Firestore lub MongoDB, struktura opiera się na kolekcjach głównych oraz podkolekcjach (sub-collections), co znacznie skraca czas odpytywania o konwersację na czacie dla poszczególnych zleceń z systemu.

### Kolekcja: `/services`
```json
{
  "_id": "doc_id_1",
  "name": "Cortex Reballing Lab",
  "description": "Specjalizujemy się w naprawach mikroskopowych, reballingu BGA...",
  "rating": 4.9,
  "completedCount": 324,
  "badge": "Certyfikowany Partner",
  "inpostLockerId": "POZ32M",
  "address": "ul. Bukowska 12, 60-818 Poznań",
  "createdAt": "2026-05-21T20:00:00Z"
}
```

### Kolekcja: `/orders`
```json
{
  "_id": "order_id_1001",
  "serviceProviderId": 1,
  "clientName": "Adrian Biber",
  "clientEmail": "Biber.Adrian@gmail.com",
  "deviceName": "MacBook Pro 16\" (M1 Pro, 2021)",
  "description": "Urządzenie nie włącza się, brak reakcji na zasilacz MagSafe po zalaniu herbatą.",
  "imageBeforeUrl": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop",
  "imageAfterUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop",
  "status": "IN_REPAIR",
  "repairCost": 600,
  "repairSummary": "Wymiana skorodowanych kondensatorów SMD w linii PPBUS_G3H oraz mikrolutowanie sterownika ISL9240.",
  "startLocker": "WAW14A",
  "targetLocker": "POZ32M",
  "trackingCodeInbound": "INP-DIAG-729481",
  "trackingCodeOutbound": "INP-RTN-129485",
  "labelPdfUrl": "/labels/inpost_label_1001.pdf",
  "reportPdfUrl": "/reports/cortex_raport_1001.pdf",
  "escrowAmount": 640,
  "escrowStatus": "FROZEN_REPAIR",
  "clientRating": null,
  "clientReview": null,
  "createdAt": "2026-05-21T21:10:00Z",
  "updatedAt": "2026-05-21T21:40:00Z",
  
  "SUB_COLLECTION: /chats": [
    {
      "id": "msg_001",
      "sender": "SYSTEM",
      "text": "Zarejestrowano nowe zlecenie. Zabezpieczono 40 PLN kaucji diagnostycznej.",
      "timestamp": "2026-05-21T21:10:05Z",
      "isRead": true
    },
    {
      "id": "msg_002",
      "sender": "SERVICE",
      "text": "Dzień dobry, urządzenie trafiło na stół warsztatowy. Zaczynam rezonans płyty głównej.",
      "timestamp": "2026-05-21T21:20:00Z",
      "isRead": true
    }
  ]
}
```

### Kolekcja: `/system_logs`
```json
{
  "_id": "log_id_554",
  "orderId": 1001,
  "timestamp": "2026-05-21T21:10:05Z",
  "action": "Zabezpieczenie Depozytu",
  "category": "ESCROW",
  "details": "Zabezpieczono 40.00 PLN depozytu przez Stripe. ID: ch_stripe_ref_XW99"
}
```

---

## 🔁 Przejścia Maszyny Stanów Zlecenia i Depozytu

Poniższy graf logiczny ilustruje zależności między etapem logistycznym (stan zlecenia) a stanem finansowym depozytu Stripe:

1. **`NEW` + `UNPAID`**  
   *(Zlecenie założone przez klienta, czekanie na opłacenie kaucji diagnostycznej)*
2. ➡️ *(Klient wykonuje przelew Stripe)* ➡️  
   **`AWAITING_SHIPMENT` + `FROZEN_DIAGNOSIS`**  
   *(Płatność kaucji zamrożona. Wygenerowany kod nadania bezetykietowego InPost)*
3. ➡️ *(Włożenie paczki do Paczkomatu i tranzyt)* ➡️  
   **`IN_TRANSIT_TO_SERVICE` + `FROZEN_DIAGNOSIS`**
4. ➡️ *(Odbiór paczki przez kuriera/serwisant)* ➡️  
   **`IN_DIAGNOSIS` + `FROZEN_DIAGNOSIS`**  
   *(Sprzęt jest diagnozowany fizycznie w serwisie)*
5. ➡️ *(Inżynier przesyła raport diagnostyczny i kosztorys)* ➡️  
   **`AWAITING_COST_APPROVAL` + `FROZEN_DIAGNOSIS`**  
   *(Czekanie na zatwierdzenie budżetu naprawy przez klienta)*
6. ➡️ *(Klient akceptuje wycenę i dopłaca środki)* ➡️  
   **`IN_REPAIR` + `FROZEN_REPAIR`**  
   *(Warsztat wykonuje faktyczne naprawy sprzętu, pełna kwota zamrożona)*
7. ➡️ *(Naprawa zakończona, testy obciążeniowe, odesłanie paczki)* ➡️  
   **`RETURN_IN_TRANSIT` + `FROZEN_REPAIR`**  
   *(InPost generuje zwrotny kod nadania i doręcza paczkę)*
8. ➡️ *(InPost dostarcza przesyłkę do Paczkomatu klienta)* ➡️  
   **`DELIVERED_AWAITING_CONFIRMATION` + `FROZEN_REPAIR`**  
   *(Urządzenie czeka w skrytce odbiorczej klienta na końcowe testy)*
9. a) ➡️ *(Klient potwierdza sprawność urządzenia)* ➡️  
   **`COMPLETED` + `RELEASED`**  
   *(Środki są zwalniane i transferowane na konto techniczne serwisu)*  
   
   b) ➡️ *(Klient zgłasza błąd po-naprawczy / spór)* ➡️  
   **`DISPUTED` + `FROZEN_REPAIR` (or DISPUTED)**  
   *(Środki pozostają zamrożone do czasu arbitrażu przeprowadzonego przez administratora)*
