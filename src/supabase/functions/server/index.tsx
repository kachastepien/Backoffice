import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-a27dc869/health", (c) => c.json({ status: "ok" }));

async function extractTextWithUnstructured(base64Data: string, filename: string = "document.png") {
  const apiKey = Deno.env.get("UNSTRUCTURED_API_KEY");
  if (!apiKey) throw new Error("Missing UNSTRUCTURED_API_KEY");

  // Remove header if present
  const base64Clean = base64Data.replace(/^data:.+;base64,/, '');
  
  // Convert base64 to Uint8Array
  const binaryString = atob(base64Clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const blob = new Blob([bytes]);
  const formData = new FormData();
  formData.append('files', blob, filename);
  formData.append('strategy', 'hi_res');
  formData.append('languages', 'pol');

  // Add timeout for OCR
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s max for OCR

  try {
      const response = await fetch("https://api.unstructuredapp.io/general/v0/general", {
        method: "POST",
        headers: {
          "unstructured-api-key": apiKey,
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Unstructured Error for ${filename}:`, errText);
        return `[Błąd odczytu pliku ${filename}]`; 
      }

      const data = await response.json();
      const text = data.map((item: any) => item.text).join("\n");
      return text;
  } catch (err) {
      if (err.name === 'AbortError') {
          console.error(`OCR Timeout for ${filename}`);
          return `[Błąd: Przekroczono czas oczekiwania na OCR (dokument zbyt złożony lub nieczytelny). Wymagana weryfikacja ręczna.]`;
      }
      throw err;
  }
}

app.post("/make-server-a27dc869/analyze-case", async (c) => {
  try {
    const body = await c.req.json();
    // Support both old single 'content' and new 'files' array
    const { content, type, files } = body; 

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return c.json({ error: "Server missing OPENAI_API_KEY" }, 500);

    // Step 2: Analyze with OpenAI (Agent 1: Legal Analyst & Documentation Specialist)
    // We construct a multimodal message (text + images)
    let userMessageContent = [];

    // Scenario 1: Multiple Files
    if (files && Array.isArray(files) && files.length > 0) {
        console.log(`Processing ${files.length} files...`);
        
        for (const [index, file] of files.entries()) {
            const isImage = file.type && file.type.startsWith('image/');
            
            userMessageContent.push({ 
                type: "text", 
                text: `\n--- DOKUMENT ${index + 1} (${file.name}) ---\n` 
            });

            // 1. VISION: If image, send directly to GPT-4o
            if (isImage) {
                 userMessageContent.push({
                    type: "image_url",
                    image_url: {
                        url: file.content // Base64 data URI
                    }
                 });
            }

            // 2. OCR: Extract text via Unstructured (best for PDFs and handwriting layout)
            try {
                const text = await extractTextWithUnstructured(file.content, file.name);
                userMessageContent.push({ 
                    type: "text", 
                    text: `ODCZYT OCR (tekst): \n${text}\n` 
                });
            } catch (e) {
                 userMessageContent.push({ 
                    type: "text", 
                    text: `[Błąd OCR: ${e.message}]\n` 
                });
            }
            
            userMessageContent.push({ type: "text", text: "\n-----------------------------------\n" });
        }
        processedFilesCount = files.length;
    } 
    // Legacy single file fallback
    else if (type === 'image' || type === 'pdf') {
         userMessageContent.push({ type: "text", text: "--- DOKUMENT POJEDYNCZY ---" });
         if (type === 'image') {
             userMessageContent.push({ type: "image_url", image_url: { url: content } });
         }
         const text = await extractTextWithUnstructured(content, "upload.png");
         userMessageContent.push({ type: "text", text: `OCR: ${text}` });
         processedFilesCount = 1;
    }
    // Text fallback
    else {
        userMessageContent.push({ type: "text", text: content || "Brak treści." });
    }

    // Safety check
    if (userMessageContent.length === 0) {
         return c.json({ error: "Brak danych do analizy." }, 400);
    }

    const analystPrompt = `
      Jesteś inteligentnym asystentem Starszego Inspektora ZUS. 
      Twój cel: Wstępna weryfikacja dokumentacji wypadkowej i przygotowanie brudnopisu (projektu) Karty Wypadku.
      
      NIE WYDAJESZ WYROKÓW. Jedynie analizujesz fakty i sugerujesz wnioski, które musi zatwierdzić człowiek.
      
      ZADANIA:
      1. Przeanalizuj załączone obrazy dokumentów ORAZ tekst z OCR.
      2. Vision (obraz) ma pierwszeństwo przy odczycie pisma odręcznego i pieczątek.
      3. OCR (tekst) pomaga przy długich opisach maszynowych.
      
      ZADANIA MERYTORYCZNE:
      1. Odczytaj wszystkie dane (daty, miejsca, nazwiska, przebieg).
      2. Wykryj ROZBIEŻNOŚCI (np. inna data w zgłoszeniu i u lekarza).
      3. Zweryfikuj wstępnie przesłanki wypadku (nagłość, przyczyna zew., uraz, związek z pracą).
      4. Jeśli są wątpliwości -> wskaż BRAKUJĄCE DOKUMENTY (np. "Brak wyjaśnień świadka X").
      5. Jeśli uraz jest niejasny -> Zaleć konsultację z Głównym Lekarzem Orzecznikiem (GLO).
      6. Przygotuj dane do KARTY WYPADKU (zgodnie z rozporządzeniem).
      7. Sformułuj PROJEKT NOTATKI SŁUŻBOWEJ / OPINII (wsparcie dla decyzji).
 
      ZASADY WYPEŁNIANIA DANYCH (CRITICAL):
      - Jeśli nie możesz odczytać danej informacji z dokumentu (np. nieczytelne pismo, zamazane zdjęcie, brak strony), wpisz w polu dokładnie: "DO UZUPEŁNIENIA".
      - Nie zgaduj danych osobowych ani dat.
      - Jeśli większość dokumentu jest nieczytelna, w polu 'summary' napisz: "UWAGA: Analiza ograniczona z powodu niskiej jakości skanów. Wymagana weryfikacja ręczna."
      - W 'missing_documents_suggestions' dodaj: "Poprawa jakości skanu (dokument nieczytelny)", jeśli dotyczy.
 
      WAŻNE: Jeśli dokument jest nieczytelny, zwróć null w polach kryteriów (criteria).
 
      Zwróć JSON:
      {
        "identified_documents": ["lista dokumentów"],
        "summary": "Syntetyczny opis stanu faktycznego (do pkt 11 Karty Wypadku)",
        "discrepancies": ["Opis rozbieżności 1", "Opis rozbieżności 2 lub brak"],
        "missing_documents_suggestions": ["Dokument 1", "Dokument 2"],
        "medical_consultation_needed": boolean,
        "criteria": {
          "suddenness": boolean | null,
          "externalCause": boolean | null,
          "injury": boolean | null,
          "workConnection": boolean | null
        },
        "criteria_explanation": { 
            "suddenness": "Uzasadnienie...", 
            "externalCause": "Uzasadnienie...", 
            "injury": "Uzasadnienie...", 
            "workConnection": "Uzasadnienie..." 
        },
        "accident_card_data": {
            "accident_date": "YYYY-MM-DD",
            "accident_place": "Miejsce zdarzenia",
            "victim_name": "Imię Nazwisko",
            "victim_pesel": "PESEL",
            "circumstances": "Szczegółowy opis okoliczności (kopiuj do Karty)",
            "causes": "Przyczyny wypadku (np. poślizgnięcie, niesprawna maszyna)",
            "effects": "Skutki (rodzaj urazu, część ciała)"
        },
        "legal_opinion_draft": "Treść projektu opinii. Format: \n1. Ustalenia faktyczne... \n2. Weryfikacja przesłanek... \n3. Rekomendacja (Uznać/Nie uznać)... \n4. Uzasadnienie..."
      }
    `;

    const analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [
            { role: "system", content: analystPrompt },
            { role: "user", content: userMessageContent }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2500 // Increased for full opinion and card data
      })
    });

    const analysisData = await analysisResponse.json();
    if (!analysisData.choices) throw new Error("OpenAI Analysis Error: " + JSON.stringify(analysisData));
    
    let legalAnalysis;
    try {
        legalAnalysis = JSON.parse(analysisData.choices[0].message.content);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        // Fallback for bad JSON
        legalAnalysis = {
            identified_documents: [],
            summary: "Błąd przetwarzania odpowiedzi AI.",
            discrepancies: [],
            missing_documents_suggestions: [],
            medical_consultation_needed: false,
            criteria: { suddenness: null, externalCause: null, injury: null, workConnection: null },
            criteria_explanation: {},
            accident_card_data: {},
            legal_opinion_draft: "Nie udało się wygenerować opinii."
        };
    }

    // Step 3: Calculation Agent (Agent 2: Actuary/Calculator)
    const calculatorPrompt = `
      Actuary Agent ZUS.
      INPUT: JSON z weryfikacją kryteriów.
      LOGIKA:
      - Jeśli kryteria są null (brak danych/błąd) -> Pewność 0%. Rekomendacja: DO WYJAŚNIENIA.
      - Jeśli jakiekolwiek kryterium = false -> Pewność < 20%.
      - Jeśli sprzeczności -> Pewność -20%.
      - Jeśli wszystko true -> Pewność > 90%.
      
      Zwróć JSON:
      {
        "confidence_score": number, 
        "recommendation_short": "UZNAĆ" | "ODMÓWIĆ" | "DO WYJAŚNIENIA",
        "reasoning_short": "Jedno zdanie."
      }
    `;


    const calcResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // CHANGED: Use faster model for logic calculation
        messages: [
            { role: "system", content: calculatorPrompt },
            { role: "user", content: JSON.stringify(legalAnalysis) }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      })
    });

    const calcData = await calcResponse.json();
    if (!calcData.choices) throw new Error("OpenAI Calculation Error: " + JSON.stringify(calcData));

    const calculation = JSON.parse(calcData.choices[0].message.content);

    // Merge results
    const finalResult = {
        ...legalAnalysis,
        calculation: calculation, // { confidence_score, recommendation_short, reasoning_short }
        processed_files_count: processedFilesCount
    };
    
    // Legacy mapping for frontend compatibility if needed
    finalResult.recommendation = calculation.recommendation_short === 'UZNAĆ' ? 'opinion_positive' : 'investigation_needed';
    
    return c.json(finalResult);

  } catch (e) {
    console.error(e);
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-a27dc869/consult-doctor", async (c) => {
  try {
    const body = await c.req.json();
    const { question, context } = body;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return c.json({ error: "Server missing OPENAI_API_KEY" }, 500);

    const systemPrompt = `
      Jesteś Głównym Lekarzem Orzecznikiem ZUS.
      Twoim zadaniem jest wydanie opinii medycznej na podstawie dokumentacji i pytania analityka.
      
      Zasady:
      1. Opieraj się na wiedzy medycznej i orzecznictwie.
      2. Bądź konkretny, rzeczowy i formalny.
      3. Oceniasz związek przyczynowo-skutkowy między zdarzeniem a urazem.
      4. Rozróżniaj urazy urazowe (wypadkowe) od schorzeń samoistnych (chorobowych).

      Format odpowiedzi JSON:
      {
        "doctor_opinion": "Treść opinii lekarskiej...",
        "conclusion": "is_injury_confirmed" | "is_disease_confirmed" | "insufficient_data",
        "icd10_suggestion": "Kod ICD-10 (jeśli możliwy do ustalenia)"
      }
    `;

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `KONTEKST SPRAWY:\n${context}\n\nPYTANIE DO LEKARZA:\n${question}` }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        response_format: { type: "json_object" },
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const result = JSON.parse(data.choices[0].message.content);
    return c.json(result);

  } catch (e) {
    console.error(e);
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-a27dc869/extract-metadata", async (c) => {
  try {
    const body = await c.req.json();
    const { file } = body; // { name, content, type }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return c.json({ error: "Server missing OPENAI_API_KEY" }, 500);

    let userMessageContent = [];
    userMessageContent.push({ type: "text", text: `Dokument: ${file.name}` });

    if (file.type && file.type.startsWith('image/')) {
        userMessageContent.push({
            type: "image_url",
            image_url: { url: file.content }
        });
    } else {
        // Text/PDF extraction via Unstructured
        try {
            const text = await extractTextWithUnstructured(file.content, file.name);
             userMessageContent.push({ 
                type: "text", 
                text: `TREŚĆ DOKUMENTU (OCR):\n${text}` 
            });
        } catch (e) {
             console.error("OCR Error in metadata extraction:", e);
             userMessageContent.push({ 
                type: "text", 
                text: "[UWAGA: OCR nieudany. Spróbuj wywnioskować dane tylko z nazwy pliku lub zwróć puste pola, aby użytkownik uzupełnił ręcznie.]" 
            });
        }
    }

    const prompt = `
        Jesteś asystentem ZUS. Twoim zadaniem jest WSTĘPNE wypełnienie formularza rejestracji sprawy na podstawie załączonego dokumentu.
        
        Wyciągnij następujące dane (jeśli brak - zwróć pusty string):
        1. Imię i Nazwisko poszkodowanego (applicantName)
        2. PESEL (applicantPesel) - jeśli są spacje usuń je.
        3. Data wypadku (accidentDate) - format YYYY-MM-DD. Jeśli nie ma roku, załóż bieżący.
        4. Krótki opis zdarzenia (description) - jedno zdanie opisujące CO się stało (np. "Upadek ze schodów", "Zawał serca").

        Zwróć JSON:
        {
            "applicantName": string,
            "applicantPesel": string,
            "accidentDate": string,
            "description": string
        }
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: userMessageContent }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const result = JSON.parse(data.choices[0].message.content);
    return c.json(result);

  } catch (e) {
      console.error("Extract Metadata Error:", e);
      return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);
