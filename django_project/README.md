# Cortex – Wdrożenie Produkcyjne (Django + MySQL + HTML5/CSS3/JS)

Ten katalog zawiera w pełni przepisany backend oraz responsywny interfejs użytkownika zoptymalizowany pod Twój stack technologiczny: **Python 3 / Django**, **MySQL**, **HTML5/CSS3 (Tailwind v4 CDN)** oraz **JavaScript (Vanilla Fetch API)**.

Możesz pobrać ten katalog jako ZIP z menu opcji Google AI Studio (Export to ZIP / GitHub) i uruchomić go na własnym serwerze VPS.

---

## 🏗️ Struktura Katalogu Projektowego

```
django_project/
├── manage.py                  # Skrypt zarządzający Django
├── cortex_project/            # Główne ustawienia projektu
│   ├── __init__.py
│   ├── settings.py            # Konfiguracja bazodanowa MySQL i Stripe/InPost
│   ├── urls.py                # Konfiguracja tras URL projektowych
│   └── wsgi.py
└── repair_app/                # Aplikacja Cortex Escrow & InPost Logistics
    ├── __init__.py
    ├── models.py              # Klasy ORM Django (ServiceProvider, RepairOrder, Chat, Logs)
    ├── views.py               # Kontrolery API (metody JSON + asynchroniczne symulatory)
    ├── urls.py                # Trasy API aplikacji
    └── templates/
        └── repair_app/
            └── index.html     # Zunifikowany, w pełni responsywny interfejs SPA w HTML5/JS
```

---

## 🛠️ Instrukcja Uruchomienia na Twoim VPS

Postępuj zgodnie z poniższymi instrukcjami, aby zainstalować i uruchomić aplikację z Twoją bazą MySQL.

### Krok 1: Instalacja zależności w Pythonie
Upewnij się, że masz zainstalowany kompilator MySQL dla Pythona (zalecamy użycie `mysqlclient`):
```bash
pip install django django-cors-headers mysqlclient
```

### Krok 2: Konfiguracja MySQL w `settings.py`
Otwórz plik `django_project/cortex_project/settings.py` i zmodyfikuj słownik `DATABASES` tak, aby odpowiadał Twojemu serwerowi MySQL:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cortex_database',       # Twoja baza danych MySQL
        'USER': 'cortex_user',           # Twój użytkownik bazy danych
        'PASSWORD': 'strong_password',   # Twoje hasło użytkownika
        'HOST': '127.0.0.1',             # IP Twojego serwera MySQL (lub localhost)
        'PORT': '3306',
    }
}
```

### Krok 3: Wykonanie migracji bazodanowych (Tworzenie tabel w MySQL)
Django automatycznie odczyta definicje modeli z pliku `models.py` i wygeneruje tabele oraz relacje w MySQL:
```bash
python manage.py makemigrations repair_app
python manage.py migrate
```

### Krok 4: Zasilenie bazy danych startową listą serwisów
Aby system wyświetlał warsztaty na Landing Page, utwórz pierwszego partnera w interaktywnej konsoli Pythona:
```bash
python manage.py shell
```
Wklej poniższy kod w konsoli:
```python
from repair_app.models import ServiceProvider
ServiceProvider.objects.create(
    name="Cortex Reballing Lab",
    description="Specjalizujemy się w naprawach mikroskopowych, reballingu BGA oraz ratowaniu urządzeń po zalaniach.",
    rating=4.95,
    completed_count=324,
    badge="Certyfikowany Partner",
    inpost_locker_id="POZ32M",
    address="ul. Bukowska 12, Poznań"
)
ServiceProvider.objects.create(
    name="Solder Core Diagnostics",
    description="Kompleksowa mikroelektronika, diagnostyka płyt głównych, wymiana pamięci NAND i naprawy FaceID.",
    rating=4.80,
    completed_count=189,
    badge="Autoryzowany Serwis",
    inpost_locker_id="WAW01C",
    address="ul. Marszałkowska 80, Warszawa"
)
exit()
```

### Krok 5: Uruchomienie serwera na VPS
W celach deweloperskich i testowych możesz uruchomić wbudowany serwer Django:
```bash
python manage.py runserver 0.0.0.0:8000
```
Wejdź pod adres `http://<IP_Twojego_VPS>:8000/` w przeglądarce, aby cieszyć się w pełni funkcjonalnym systemem zintegrowanym z MySQL!

---

## 🔒 Skalowanie do Produkcji (Gunicorn + Nginx)
Podczas przenoszenia projektu na środowisko produkcyjne VPS zaleca się postawienie serwera WSGI (np. Gunicorn) pod kontrolą Nginx jako reverse proxy:
```bash
pip install gunicorn
gunicorn cortex_project.wsgi:application --bind 0.0.0.0:8000
```
Nginx ułatwi także obsługę certyfikacji SSL od Let's Encrypt, zabezpieczając depozyty i logi komunikacyjne bezpiecznym protokołem HTTPS.
