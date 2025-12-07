# ZANT – Narzędzie Wspomagające Obsługę Wypadków przy Pracy  
## Etap II – Asystent Analityczny dla Pracowników ZUS

🔗 **Demo online:** https://ascii-spring-81419685.figma.site

ZANT to inteligentny asystent, który wspiera **pracowników ZUS** w analizie zgłoszeń wypadków przy pracy.  
System automatyzuje żmudne i czasochłonne czynności: od odczytywania skanów i pisma odręcznego, przez analizę faktów, aż po przygotowanie projektu **Karty Wypadku** i **projektu opinii**.

Model został wytrenowany na bazie **rzeczywistych spraw ZUS**, dzięki czemu potrafi rozpoznawać wzorce dokumentacji, typowe opisy zdarzeń i najczęściej pojawiające się braki.

---

## 🎯 Cel narzędzia

- Przyspieszenie pracy urzędników ZUS  
- Automatyczne wyłapywanie niespójności w dokumentach  
- Redukcja błędów związanych z ręcznym przepisywaniem danych  
- Przygotowanie projektu opinii i projektu Karty Wypadku  
- Zachowanie pełnej kontroli pracownika nad rozstrzygnięciem  

ZANT **nie decyduje zamiast urzędnika** — dostarcza mu kompletnej analizy, dzięki której decyzja jest szybsza i bardziej rzetelna.

---

## 🔍 Funkcje ZANT (Etap II)

### 1. Odczyt dokumentów (OCR + AI)
System automatycznie odczytuje:

- skany PDF,  
- zdjęcia dokumentów,  
- **pismo odręczne** poszkodowanego i świadków.

Wykorzystujemy **Unstructured.ai** oraz modele OCR dostosowane do specyfiki polskich formularzy.

---

### 2. Automatyczna ekstrakcja danych ("Smart Upload")
Przy tworzeniu nowej sprawy, możesz wgrać skan zgłoszenia (PDF/JPG) bezpośrednio w oknie rejestracji.
System **automatycznie odczyta dane** (Imię, Nazwisko, Datę, Opis) i wypełni za Ciebie formularz rejestracyjny, eliminując ręczne wpisywanie danych.

---

### 3. Weryfikacja spójności dokumentacji
System porównuje dane z różnych źródeł i wskazuje potencjalne błędy:

- rozbieżności w datach i godzinach,  
- różne wersje miejsca lub okoliczności zdarzenia,  
- brak potwierdzenia urazu w dokumentacji medycznej,  
- niespójności między wyjaśnieniami a kartą lekarską.

Przykład komunikatu:

> „Data w zgłoszeniu (12.05) nie zgadza się z datą w dokumentacji lekarskiej (13.05).”

---

### 4. Analiza spełnienia definicji wypadku
ZANT ocenia, czy w dokumentach znajdują się elementy czterech przesłanek:

- **nagłość zdarzenia**,  
- **przyczyna zewnętrzna**,  
- **uraz**,  
- **związek z pracą**.

System nie podejmuje decyzji, ale oznacza braki i podpowiada, czego brakuje do pełnej oceny.

---

### 5. Wskazywanie braków w dokumentacji
Narzędzie automatycznie generuje listę braków, np.:

- brak świadków lub brak ich wyjaśnień,  
- niejasny opis urazu,  
- brak podpisów,  
- brak dokumentacji medycznej potwierdzającej uraz.

Braki są klasyfikowane jako:

- **krytyczne**,  
- **ważne**,  
- **opcjonalne**.

---

### 6. Wsparcie w kwestiach medycznych
Przy skomplikowanych urazach system:

- wskazuje fragmenty wymagające konsultacji,  
- podpowiada pytania do Lekarza Orzecznika, np.:

> „Czy stwierdzony uraz kręgosłupa pozostaje w związku z mechanizmem upadku z wysokości ok. 1 m?”

---

### 7. Generowanie projektu opinii (brudnopis)
ZANT przygotowuje propozycję opinii zawierającą:

- opis stanu faktycznego,  
- wskazanie dowodów,  
- analizę przesłanek,  
- proponowane rozstrzygnięcie (do akceptacji urzędnika).

Urzędnik może łatwo edytować i dopracować treść.

---

### 8. Automatyczne przygotowanie **Karty Wypadku**
System uzupełnia projekt Karty Wypadku zgodnie z obowiązującym wzorem:

- jednoznaczne dane → wpisywane automatycznie,  
- niepewne dane → oznaczone jako **„DO UZUPEŁNIENIA”**.

Urzędnik nie musi przepisywać treści — system robi to za niego.

---

## 🛠️ Technologia

- **OCR / Computer Vision:** Unstructured.ai, custom OCR  
- **Analiza tekstu:** modele GPT z dopasowanymi guardrails  
- **Silnik regułowy:** walidacja braków i spójności  
- **Generator dokumentów:** PDF + Karta Wypadku  
- **Bezpieczeństwo:** anonimizacja danych uczących, zgodność z procedurami ZUS

---

## 📌 Podsumowanie

ZANT to narzędzie, które:
- przyspiesza proces analizy wypadku,  
- redukuje obciążenie administracyjne,  
- poprawia jakość decyzji,  
- zapewnia pełną transparentność i kontrolę dla urzędnika.

System nie zastępuje człowieka — **wzmacnia jego efektywność**.

---

## 🚀 Instrukcja Testowania (Dla Jury)

System oferuje dwie ścieżki testowania:

### Ścieżka A: Szybki Test (Gotowy zestaw danych)
1.  **Przygotowanie:** Na Pulpicie aplikacji kliknij przycisk **`[Załaduj Zestaw Testowy (Jury)]`**.
2.  **Efekt:** System automatycznie utworzy **5 spraw** o zróżnicowanej specyfice (budowa, biuro, komunikacyjny, maszyny, zawał).
3.  **Test:** Wejdź w wybraną sprawę, wgraj pliki testowe i kliknij **`[Rozpocznij Analizę Sprawy]`**, aby zobaczyć automatycznie wygenerowane wnioski i projekty dokumentów.

### Ścieżka B: Własny Przypadek (Smart Upload)
1.  Kliknij przycisk **`[+ Nowe Zgłoszenie]`**.
2.  W polu "Upuść dokument" **wgraj plik PDF lub zdjęcie** (np. skan zgłoszenia wypadku).
3.  **Obserwuj:** System automatycznie przeanalizuje dokument i **wypełni formularz rejestracyjny** (Imię, Nazwisko, Data, Opis) danymi odczytanymi z pliku.
4.  Kliknij `[Utwórz sprawę]` – plik zostanie automatycznie dołączony do nowej sprawy i będzie gotowy do pełnej analizy prawnej.
