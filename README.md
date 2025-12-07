# ZANT – Narzędzie Wspomagające Obsługę Wypadków przy Pracy

## O narzędziu Etap 2

ZANT to aplikacja stworzona, aby **wspierać pracowników ZUS** w codziennej pracy przy obsłudze zawiadomień o wypadkach. Narzędzie działa jak "inteligentny asystent", który wykonuje najbardziej czasochłonne czynności – czytanie dokumentów, wyłapywanie dat i faktów – pozostawiając urzędnikowi ostateczną decyzję.

Głównym celem jest ułatwienie pracy osobom sporządzającym karty wypadku oraz przygotowującym opinie, poprzez automatyzację żmudnego przepisywania danych z papierowych formularzy i skanów.

---

## Jak narzędzie pomaga urzędnikowi?

Aplikacja realizuje konkretne zadania, o które prosił zamawiający:

### 1. Czytanie "trudnych" dokumentów (OCR)
Pracownik nie musi ręcznie przepisywać danych z odręcznych notatek czy zamazanych skanów.
- Narzędzie odczytuje skany PDF, zdjęcia oraz **pismo odręczne** (np. wyjaśnienia poszkodowanego).
- System radzi sobie z dokumentacją papierową przekształconą na cyfrową.

### 2. Sprawdzanie spójności faktów
Asystent automatycznie porównuje dokumenty i zwraca uwagę pracownika na ewentualne pomyłki, np.:
- "Data wypadku w zgłoszeniu (12.05) różni się od daty u lekarza (13.05)".
- "Świadek podaje inne miejsce zdarzenia niż poszkodowany".

### 3. Wstępna analiza przesłanek wypadku
System porządkuje informacje potrzebne do podjęcia decyzji, sprawdzając cztery kluczowe elementy definicji wypadku:
- Czy zdarzenie było nagłe?
- Czy była przyczyna zewnętrzna?
- Czy wystąpił uraz?
- Czy miało to związek z pracą?

### 4. Sugerowanie braków w dokumentacji
Jeśli w aktach brakuje kluczowych informacji, narzędzie podpowiada pracownikowi:
- "Brakuje wyjaśnień świadka zdarzenia – warto je pozyskać".
- "Opis urazu jest niejasny".

### 5. Wsparcie w kwestiach medycznych
Gdy opis urazu jest skomplikowany, system sugeruje konsultację z Lekarzem Orzecznikiem i pomaga sformułować precyzyjne pytanie (np. o odróżnienie urazu od choroby samoistnej).

### 6. Przygotowanie projektu opinii (brudnopis)
Na koniec analizy narzędzie generuje **wstępny projekt opinii**. Pracownik otrzymuje gotowy tekst z:
- Uporządkowanym stanem faktycznym.
- Propozycją uzasadnienia.
- Wnioskami do weryfikacji przez urzędnika.

### 7. Wypełnianie Karty Wypadku
System automatycznie uzupełnia projekt **Karty Wypadku** (zgodnie z obowiązującym rozporządzeniem) danymi wyciągniętymi z dokumentów. Pola, których nie udało się odczytać jednoznacznie, są wyraźnie oznaczane jako "DO UZUPEŁNIENIA", aby pracownik mógł je łatwo znaleźć i poprawić.

---

## Technologia w służbie urzędnika

Narzędzie działa w tle, wykorzystując nowoczesne rozwiązania do analizy tekstu i obrazu, aby "rozumieć" treść dokumentów tak, jak człowiek.

*   **Analiza Obrazu:** System "widzi" skany, dzięki czemu rozpoznaje pieczątki i pismo ręczne - Unstructured.ai do OCR
*   **Analiza Tekstu:** Wyciąga kluczowe dane (daty, nazwiska) i układa je w logiczną całość.
*   **Bezpieczeństwo:** System działa na zanonimizowanych danych uczących, opartych na rzeczywistych wzorach dokumentacji ZUS.
