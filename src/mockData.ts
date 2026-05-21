/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceProfile, RepairOrder, ChatMessage, SystemLog } from './types';

export const INITIAL_SERVICES: ServiceProfile[] = [
  {
    id: 1,
    name: 'Laptop-Med Poznań',
    city: 'Poznań',
    specialization: 'Laptopy, mikrolutowanie, regeneracja płyt głównych',
    description: 'Specjalizujemy się w naprawach mikroskopowych, reballingu BGA oraz ratowaniu urządzeń po zalaniu. Posiadamy własne laboratorium i profesjonalny sprzęt lutowniczy. Szybkie terminy diagnozy.',
    rating: 4.9,
    completedCount: 324,
    badge: 'Certyfikowany Partner',
    inpostLockerId: 'POZ32M',
    address: 'ul. Bukowska 12, 60-818 Poznań'
  },
  {
    id: 2,
    name: 'iFix Center Warszawa',
    city: 'Warszawa',
    specialization: 'Smartfony, tablety Apple/Samsung, wymiana szybek',
    description: 'Serwis urządzeń mobilnych premium. Oferujemy laserową wymianę tylnych szybek w smartfonach iPhone, naprawy FaceID oraz bezpieczną wymianę wyświetlaczy OCA bez komunikatów o niezgodności.',
    rating: 4.8,
    completedCount: 512,
    badge: 'Szybka Diagnoza',
    inpostLockerId: 'WAW01C',
    address: 'ul. Marszałkowska 85, 00-510 Warszawa'
  },
  {
    id: 3,
    name: 'Silesia Console Laboratorium',
    city: 'Katowice',
    specialization: 'Konsole do gier, naprawa padów, HDMI',
    description: 'Twoja konsola głośno chodzi, nie czyta płyt lub brakuje obrazu? Jesteśmy ekspertami w naprawie konsol PlayStation, Xbox oraz Nintendo Switch. Wymieniamy lasery, gniazda i nakładamy ciekły metal.',
    rating: 4.9,
    completedCount: 198,
    badge: 'Specjalista HDMI',
    inpostLockerId: 'KAT04B',
    address: 'ul. Korfantego 32, 40-005 Katowice'
  },
  {
    id: 4,
    name: 'Elektronika Serwis Trójmiasto',
    city: 'Gdańsk',
    specialization: 'Inne, audio hi-fi, drony, sprzęt specjalistyczny',
    description: 'Kompleksowe naprawy elektroniki niestandardowej. Naprawiamy drony DJI, sterowniki przemysłowe, audio Hi-Fi oraz sprzęt medyczny. Do każdego zlecenia dołączamy precyzyjny raport z oscyloskopu.',
    rating: 4.7,
    completedCount: 145,
    badge: 'Szeroki Zakres',
    inpostLockerId: 'GDN88A',
    address: 'ul. Grunwaldzka 102, 80-244 Gdańsk'
  }
];

export const INITIAL_ORDERS: RepairOrder[] = [
  {
    id: 101,
    clientName: 'Adrian Biber',
    clientEmail: 'Biber.Adrian@gmail.com',
    deviceName: 'MacBook Pro 14" M1 (2021)',
    category: 'Laptopy',
    description: 'Laptop wyłączył się podczas ładowania i nie reaguje na zasilacz. Brak śladów zalania, ładowarka sprawdzona na innym urządzeniu i działa.',
    status: 'IN_DIAGNOSIS',
    serviceProviderId: 1, // Laptop-Med Poznań
    imageBeforeUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop',
    imageAfterUrl: null,
    diagnosisFee: 40,
    repairCost: null,
    trackingCodeInbound: 'INP-MAC-83712',
    trackingCodeOutbound: null,
    startLocker: 'KRA01N',
    targetLocker: 'POZ32M',
    escrowStatus: 'FROZEN_DIAGNOSIS',
    escrowAmount: 40,
    labelPdfUrl: '/labels/inpost_label_101.pdf',
    reportPdfUrl: null,
    repairSummary: null,
    clientRating: null,
    clientReview: null,
    createdAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 102,
    clientName: 'Jan Kowalski',
    clientEmail: 'jan.kowalski@wp.pl',
    deviceName: 'PlayStation 5 Disc Edition',
    category: 'Konsole',
    description: 'Konsola uruchamia się, ale nie przesyła obrazu do telewizora (brak sygnału na porcie HDMI). Próba podmiany kabla nie pomogła. Gniazdo HDMI wydaje się luźne.',
    status: 'AWAITING_COST_APPROVAL',
    serviceProviderId: 3, // Silesia Console Laboratorium
    imageBeforeUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop',
    imageAfterUrl: null,
    diagnosisFee: 40,
    repairCost: 280,
    trackingCodeInbound: 'INP-PS5-92817',
    trackingCodeOutbound: null,
    startLocker: 'WAW14A',
    targetLocker: 'KAT04B',
    escrowStatus: 'FROZEN_DIAGNOSIS',
    escrowAmount: 40,
    labelPdfUrl: '/labels/inpost_label_102.pdf',
    reportPdfUrl: null,
    repairSummary: 'Zdiagnozowano fizyczne uszkodzenie mechaniczne pinów portu HDMI. Konieczne jest całkowite wylutowanie starego gniazda i wlutowanie nowego, oryginalnego portu HDMI zgodnego z PS5 Spec. Usługa obejmuje także czyszczenie z kurzu i wymianę past termo-aktywnych.',
    clientRating: null,
    clientReview: null,
    createdAt: '2026-05-15T08:15:00Z',
    updatedAt: '2026-05-16T15:40:00Z'
  },
  {
    id: 103,
    clientName: 'Anna Nowak',
    clientEmail: 'anna.nowak@gmail.com',
    deviceName: 'iPhone 13 Pro Graphite',
    category: 'Smartfony',
    description: 'Zbita szybka ekranu, sam wyświetlacz OLED i dotyk działają bez problemu. Zależy mi na zachowaniu oryginalnego ekranu i braku błędu w ustawieniach ("Nieweryfikowalny element").',
    status: 'COMPLETED',
    serviceProviderId: 2, // iFix Center Warszawa
    imageBeforeUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&auto=format&fit=crop',
    imageAfterUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop',
    diagnosisFee: 40,
    repairCost: 450,
    trackingCodeInbound: 'INP-IPH-21390',
    trackingCodeOutbound: 'INP-IPH-88320',
    startLocker: 'GDY02H',
    targetLocker: 'WAW01C',
    escrowStatus: 'RELEASED',
    escrowAmount: 490,
    labelPdfUrl: '/labels/inpost_label_103.pdf',
    reportPdfUrl: '/reports/cortex_raport_103.pdf',
    repairSummary: 'Wykonano bezpieczną separację rozbitej szyby od oryginalnej matrycy OLED podgrzewaczem próżniowym. Nałożono nową szybę o podwyższonej twardości metodą pozycjonowania OCA w komorze bezpyłowej. Przepływ prądu i parametry dotykowe zweryfikowane pozytywnie.',
    clientRating: 5,
    clientReview: 'Fantastyczna obsługa! Ekran wygląda i działa jak nowy, brak jakichkolwiek komunikatów o nieoryginalnej części w systemie iOS. Bezpieczna escrow płatność dała mi pełen komfort.',
    createdAt: '2026-05-10T12:00:00Z',
    updatedAt: '2026-05-14T17:10:00Z'
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  // Order 101 Chat
  {
    id: 'm1',
    orderId: 101,
    sender: 'SYSTEM',
    text: 'Zlecenie zostało utworzone w systemie Cortex. Opłacono koszt diagnozy (40 PLN). Środki zostały wstrzymane w bezpiecznym depozycie Stripe Escrow.',
    timestamp: '2026-05-18T10:01:00Z',
    isRead: true
  },
  {
    id: 'm2',
    orderId: 101,
    sender: 'SYSTEM',
    text: 'Logistyka InPost: Wygenerowano bezetykietowy kod nadania: 837129 (kod ważny przez 72h). Umieść paczkę z urządzeniem w wybranym Paczkomacie KRA01N.',
    timestamp: '2026-05-18T10:02:00Z',
    isRead: true
  },
  {
    id: 'm3',
    orderId: 101,
    sender: 'SYSTEM',
    text: 'Paczka nadana w Paczkomacie nadawczym KRA01N o godzinie 17:42.',
    timestamp: '2026-05-18T17:45:00Z',
    isRead: true
  },
  {
    id: 'm4',
    orderId: 101,
    sender: 'SYSTEM',
    text: 'Paczka odebrana przez kuriera InPost i przekazana do serwisu docelowego Poznań.',
    timestamp: '2026-05-19T09:12:00Z',
    isRead: true
  },
  {
    id: 'm5',
    orderId: 101,
    sender: 'SYSTEM',
    text: 'Odbiorca (Laptop-Med Poznań) odebrał paczkę z Paczkomatu docelowego POZ32M.',
    timestamp: '2026-05-20T11:20:00Z',
    isRead: true
  },
  {
    id: 'm6',
    orderId: 101,
    sender: 'SERVICE',
    text: 'Dzień dobry panie Adrianie. MacBook dotarł do nas bezpiecznie. Wstępnie rozkręciliśmy komputer i podłączyliśmy go pod zasilacz laboratoryjny. Na porcie wejściowym USB-C mamy zwarcie rzędu 0.2A. Rozpoczynamy precyzyjną próbę termowizyjną płyty głównej, by odnaleźć uszkodzony chip zasilania. Odezwę się zaraz po zlokalizowaniu usterki!',
    timestamp: '2026-05-20T14:30:00Z',
    isRead: true
  },

  // Order 102 Chat
  {
    id: 'm10',
    orderId: 102,
    sender: 'SYSTEM',
    text: 'Zlecenie utworzone. Depozyt diagnozy 40 PLN w bezpiecznym depozycie.',
    timestamp: '2026-05-15T08:15:00Z',
    isRead: true
  },
  {
    id: 'm11',
    orderId: 102,
    sender: 'SERVICE',
    text: 'Zakończono proces diagnostyczny. Urządzenie rozebraliśmy w osłonie ESD. Powodem usterki jest mechanicznie wyszczerobiony i odłamany od płytki drukowanej port HDMI. Ścieżki sygnałowe na szczęście nie są zerwane.',
    timestamp: '2026-05-16T15:30:00Z',
    isRead: true
  },
  {
    id: 'm12',
    orderId: 102,
    sender: 'SYSTEM',
    text: 'Serwis przedstawił wycenę naprawy: 280 PLN. Status zlecenia zmienił się na: Oczekuje na akceptację kosztów przez klienta.',
    timestamp: '2026-05-16T15:40:00Z',
    isRead: true
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-15T08:15:00Z',
    action: 'Utworzenie zlecenia',
    category: 'ORDER',
    details: 'Klient Jan Kowalski utworzył zlecenie #102 na naprawę PlayStation 5 w Silesia Console.',
    orderId: 102
  },
  {
    id: 'log-2',
    timestamp: '2026-05-15T08:15:40Z',
    action: 'Przedpłata Stripe Escrow',
    category: 'ESCROW',
    details: 'Zabezpieczono 40.00 PLN depozytu diagnozy dla zlecenia #102. ID platformy: stripe_ch_9x12ad81',
    orderId: 102
  },
  {
    id: 'log-3',
    timestamp: '2026-05-15T08:16:00Z',
    action: 'Logistyka InPost',
    category: 'LOGISTICS',
    details: 'InPost API wygenerowało kod zwrotny dla zlecenia #102. Kod: 928173. Paczkomat: WAW14A.'
  },
  {
    id: 'log-4',
    timestamp: '2026-05-18T10:00:00Z',
    action: 'Utworzenie zlecenia',
    category: 'ORDER',
    details: 'Klient Adrian Biber utworzył zlecenie #101 na naprawę MacBook Pro 14" w Laptop-Med.',
    orderId: 101
  },
  {
    id: 'log-5',
    timestamp: '2026-05-18T10:01:20Z',
    action: 'Przedpłata Stripe Escrow',
    category: 'ESCROW',
    details: 'Zabezpieczono 40.00 PLN depozytu diagnozy dla zlecenia #101. ID platformy: stripe_ch_22a7f1s2',
    orderId: 101
  },
  {
    id: 'log-6',
    timestamp: '2026-05-20T11:20:00Z',
    action: 'Dostarczenie do serwisu',
    category: 'LOGISTICS',
    details: 'Paczka InPost #KRA01N została odebrana przez odbiorcę Laptop-Med z paczkomatu Poznań POZ32M.',
    orderId: 101
  }
];
