import React, { useState, useEffect, useRef } from "react";

// TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Language {
  code: string;
  name: string;
}

interface ColorTheme {
  bg: string;
  text: string;
  light: string;
}

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [synonyms, setSynonyms] = useState<{ [key: string]: string[] }>({});
  const [definitions, setDefinitions] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const translationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we should show the translation
  const [showTranslation, setShowTranslation] = useState(false);

  // Create a ref for the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reference to prevent stale closures in async operations
  const sourceRef = useRef(sourceLang);
  const targetRef = useRef(targetLang);

  useEffect(() => {
    sourceRef.current = sourceLang;
    targetRef.current = targetLang;
  }, [sourceLang, targetLang]);

  // Language options
  const languages: Language[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
  ];

  // Language colors for visual identity
  const langColors: Record<string, ColorTheme> = {
    en: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50" },
    es: { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-50" },
    fr: { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50" },
    de: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50" },
    it: { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" },
  };

  // Microsoft API configuration
  const translatorApiKey = "PLACE_MICROSOFT_API_KEY_HERE"; //PLACE MICROSOFT API KEY HERE
  const endpoint = "https://api.cognitive.microsofttranslator.com";
  const region = "eastus";

  // cleanup function
  const forceCleanup = () => {
    // Cancel any timers
    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
      translationTimerRef.current = null;
    }

    // Clear all translation-related states
    setTranslatedText("");
    setSynonyms({});
    setDefinitions({});
    setIsLoading(false);
    setError("");
    setShowTranslation(false);

    // Additional fail-safe timeouts at different intervals
    setTimeout(() => setTranslatedText(""), 10);
    setTimeout(() => setShowTranslation(false), 20);
    setTimeout(() => {
      setTranslatedText("");
      setSynonyms({});
      setDefinitions({});
    }, 50);
  };

  // Utility function to clean words from punctuation
  const cleanWordFromPunctuation = (word: string): string => {
    return word.trim().replace(/^[^\w\s]+|[^\w\s]+$/g, "");
  };

  // Speech recognition setup
  const useSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      setError("Speech recognition error: " + event.error);
      setIsRecording(false);
    };

    return recognition;
  };

  const recognition = useSpeechRecognition();

  // Handle recording
  const handleRecord = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.lang = sourceLang;
      recognition.start();
      setIsRecording(true);
      setError("");
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Backspace" &&
      (inputText.length <= 1 || e.currentTarget.value.length <= 1)
    ) {
      forceCleanup();

      // Schedule multiple cleanup attempts to handle race conditions
      const cleanupAttempts = [10, 30, 50, 100, 200];
      cleanupAttempts.forEach((delay) => {
        setTimeout(() => {
          setShowTranslation(false);
          setTranslatedText("");
        }, delay);
      });
    }
  };

  // Handle input text changes with emptiness detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);

    // Check for emptiness
    const isEmpty =
      newText === "" || newText.trim() === "" || newText.length === 0;

    if (isEmpty) {
      // Input is empty now
      forceCleanup();

      // Focus on the textarea to ensure we catch future backspace events
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Function to swap source and target languages
  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);

    // Clear current translations and related data
    if (inputText && translatedText) {
      setInputText(translatedText);
      forceCleanup();
    }
  };

  // Handle source language change with auto-swap
  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSourceLang = e.target.value;

    // If the new source language is the same as target, swap them
    if (newSourceLang === targetLang) {
      setSourceLang(newSourceLang);
      setTargetLang(sourceLang);
    } else {
      setSourceLang(newSourceLang);
    }
  };

  // Handle target language change with auto-swap
  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTargetLang = e.target.value;

    // If the new target language is the same as source, swap them
    if (newTargetLang === sourceLang) {
      setTargetLang(newTargetLang);
      setSourceLang(targetLang);
    } else {
      setTargetLang(newTargetLang);
    }
  };

  // Helper function for Microsoft Translator API calls
  const callMicrosoftTranslator = async (
    path: string,
    from: string,
    to: string,
    text: string
  ) => {
    if (!translatorApiKey || !text.trim()) return null;

    try {
      const response = await fetch(
        `${endpoint}${path}?api-version=3.0&from=${from}&to=${to}`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": translatorApiKey,
            "Ocp-Apim-Subscription-Region": region,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ text: text.trim() }]),
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        console.error(`API error: ${path}`, await response.text());
        return null;
      }

      return await response.json();
    } catch (err) {
      console.error(`API call failed: ${path}`, err);
      return null;
    }
  };

  // Translate text using Microsoft Translator API (with MyMemory as fallback)
  const translateText = async (text: string) => {
    if (!text || !text.trim()) {
      forceCleanup();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check again right before making API call
      if (!text.trim()) {
        forceCleanup();
        return;
      }

      // Try Microsoft Translator API first
      const data = await callMicrosoftTranslator(
        "/translate",
        sourceRef.current,
        targetRef.current,
        text
      );

      // Check after the API call returns
      if (!inputText.trim()) {
        forceCleanup();
        return;
      }

      if (data && data.length > 0 && data[0].translations?.length > 0) {
        setTranslatedText(data[0].translations[0].text);
        setShowTranslation(true);
        setIsLoading(false);
        return;
      }

      // Check before fallback
      if (!inputText.trim()) {
        forceCleanup();
        return;
      }

      // Fallback to MyMemory
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${sourceRef.current}|${targetRef.current}&mt=1`,
        { signal: AbortSignal.timeout(5000) }
      );

      // Final check after API call
      if (!inputText.trim()) {
        forceCleanup();
        return;
      }

      const myMemoryData = await response.json();

      if (myMemoryData.responseStatus === 200) {
        // Get the main translation
        let finalTranslation = myMemoryData.responseData.translatedText;

        // If there are matches (from translation memory), use the best one if it's high quality
        if (myMemoryData.matches?.length > 0) {
          // Sort by quality
          const bestMatches = myMemoryData.matches
            .filter((match: any) => match.quality > 70)
            .sort((a: any, b: any) => b.quality - a.quality);

          if (bestMatches.length > 0 && bestMatches[0].quality > 90) {
            finalTranslation = bestMatches[0].translation;
          }
        }

        setTranslatedText(finalTranslation);
        setShowTranslation(true);
      } else {
        throw new Error(myMemoryData.responseMessage || "Unknown error");
      }
    } catch (err) {
      console.error("Translation failed:", err);
      setError("Translation service error. Please try again later.");
    } finally {
      setIsLoading(false);

      // Final safety check
      if (!inputText.trim()) {
        forceCleanup();
      }
    }
  };

  // Fetch word details using Microsoft Translator Dictionary API for synonyms
  const fetchWordDetails = async (
    word: string,
    fromLang: string,
    toLang: string
  ) => {
    if (!word.trim()) return { synonyms: [] };

    // Clean the word from punctuation if it's a single word
    const cleanedWord = cleanWordFromPunctuation(word);

    const data = await callMicrosoftTranslator(
      "/dictionary/lookup",
      fromLang,
      toLang,
      cleanedWord
    );

    if (data && data.length > 0 && data[0].translations?.length > 0) {
      // Extract alternate translations as "synonyms"
      const synonyms = data[0].translations
        .map((t: any) => t.displayTarget)
        .slice(0, 3);

      return { synonyms };
    }

    return { synonyms: [] };
  };

  // Fetch definitions using free Dictionary API
  const fetchDefinitions = async (word: string, lang: string) => {
    if (!word.trim()) return { definitions: [] };

    try {
      // Dictionary API only supports en, es, fr, de, it and a few others
      const supportedLangs = ["en", "es", "fr", "de", "it"];
      const apiLang = supportedLangs.includes(lang) ? lang : "en";

      // Clean the word from punctuation if it's a single word
      const cleanedWord = cleanWordFromPunctuation(word);

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${encodeURIComponent(
          cleanedWord.trim()
        )}`
      );

      if (!response.ok) {
        return { definitions: [] };
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // Extract definitions from all meanings
        const allDefinitions: string[] = [];
        data[0].meanings.forEach((meaning: any) => {
          if (meaning.definitions && Array.isArray(meaning.definitions)) {
            allDefinitions.push(
              ...meaning.definitions.map((d: any) => d.definition)
            );
          }
        });

        return {
          definitions: [...new Set(allDefinitions)].slice(0, 2),
        };
      }
      return { definitions: [] };
    } catch (err) {
      console.error("Error fetching definitions:", err);
      return { definitions: [] };
    }
  };

  // Translate a definition
  const translateDefinition = async (
    text: string,
    from: string,
    to: string
  ) => {
    if (!text.trim()) return "";

    const data = await callMicrosoftTranslator("/translate", from, to, text);

    if (data && data.length > 0 && data[0].translations?.length > 0) {
      return data[0].translations[0].text;
    }

    return "";
  };

  // Speak translated text
  const speakText = (text: string, lang: string) => {
    if (!text) return;

    if (!window.speechSynthesis) {
      setError("Text-to-speech is not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  // Effect to handle translation after input changes with a half-second delay
  useEffect(() => {
    // Always clear any existing timer first
    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
      translationTimerRef.current = null;
    }

    // If input is empty, ensure everything is cleared
    if (!inputText || !inputText.trim()) {
      forceCleanup();
      return;
    }

    // Only proceed if we definitely have content
    translationTimerRef.current = setTimeout(() => {
      // Re-check emptiness right before translating
      if (!inputText || !inputText.trim()) {
        forceCleanup();
        return;
      }

      // Now safe to translate
      translateText(inputText);
    }, 500); // half-second delay

    return () => {
      if (translationTimerRef.current) {
        clearTimeout(translationTimerRef.current);
        translationTimerRef.current = null;
      }
    };
  }, [inputText]);

  // Effect to handle word details after translation
  useEffect(() => {
    const getWordDetails = async () => {
      // First check if both input and translation exist
      if (!inputText.trim() || !translatedText.trim() || !showTranslation) {
        setSynonyms({});
        setDefinitions({});
        return;
      }

      // Check if input or translation are single words
      const inputWords = inputText.trim().split(/\s+/);
      const translatedWords = translatedText.trim().split(/\s+/);

      // Consider it a single word if it has one word
      const words = {
        source: inputWords.length === 1 ? inputText.trim() : "",
        target: translatedWords.length === 1 ? translatedText.trim() : "",
      };

      if (!words.source && !words.target) {
        setSynonyms({});
        setDefinitions({});
        return;
      }

      setIsLoading(true);

      // Get synonyms using Microsoft Dictionary API
      const sourceToTargetResults = words.source
        ? await fetchWordDetails(words.source, sourceLang, targetLang)
        : { synonyms: [] };

      const targetToSourceResults = words.target
        ? await fetchWordDetails(words.target, targetLang, sourceLang)
        : { synonyms: [] };

      // Get definitions in source and target languages
      let sourceDefinitions: string[] = [];
      let targetDefinitions: string[] = [];

      // Try to get English definitions first as they're most reliable
      if (sourceLang === "en" && words.source) {
        const englishDefs = await fetchDefinitions(words.source, "en");
        sourceDefinitions = englishDefs.definitions;

        // Translate English definitions to target language
        if (sourceDefinitions.length > 0) {
          const translatedDefs = await Promise.all(
            sourceDefinitions.map((def) =>
              translateDefinition(def, "en", targetLang)
            )
          );
          targetDefinitions = translatedDefs.filter((def) => def.length > 0);
        }
      } else if (targetLang === "en" && words.target) {
        const englishDefs = await fetchDefinitions(words.target, "en");
        targetDefinitions = englishDefs.definitions;

        // Translate English definitions to source language
        if (targetDefinitions.length > 0) {
          const translatedDefs = await Promise.all(
            targetDefinitions.map((def) =>
              translateDefinition(def, "en", sourceLang)
            )
          );
          sourceDefinitions = translatedDefs.filter((def) => def.length > 0);
        }
      } else {
        // If neither language is English, try both languages directly
        if (words.source) {
          const sourceLangDefs = await fetchDefinitions(
            words.source,
            sourceLang
          );
          sourceDefinitions = sourceLangDefs.definitions;
        }

        if (words.target) {
          const targetLangDefs = await fetchDefinitions(
            words.target,
            targetLang
          );
          targetDefinitions = targetLangDefs.definitions;
        }

        // If either is empty, try translating from the other language
        if (
          sourceDefinitions.length > 0 &&
          targetDefinitions.length === 0 &&
          words.target
        ) {
          const translatedDefs = await Promise.all(
            sourceDefinitions.map((def) =>
              translateDefinition(def, sourceLang, targetLang)
            )
          );
          targetDefinitions = translatedDefs.filter((def) => def.length > 0);
        } else if (
          targetDefinitions.length > 0 &&
          sourceDefinitions.length === 0 &&
          words.source
        ) {
          const translatedDefs = await Promise.all(
            targetDefinitions.map((def) =>
              translateDefinition(def, targetLang, sourceLang)
            )
          );
          sourceDefinitions = translatedDefs.filter((def) => def.length > 0);
        }
      }

      // Store synonyms by language
      const newSynonyms: { [key: string]: string[] } = {};
      if (sourceToTargetResults.synonyms.length > 0) {
        newSynonyms[targetLang] = sourceToTargetResults.synonyms;
      }
      if (targetToSourceResults.synonyms.length > 0) {
        newSynonyms[sourceLang] = targetToSourceResults.synonyms;
      }
      setSynonyms(newSynonyms);

      // Store definitions by language
      const newDefinitions: { [key: string]: string[] } = {};
      if (sourceDefinitions.length > 0) {
        newDefinitions[sourceLang] = sourceDefinitions;
      }
      if (targetDefinitions.length > 0) {
        newDefinitions[targetLang] = targetDefinitions;
      }

      setDefinitions(newDefinitions);
      setIsLoading(false);
    };

    getWordDetails();
  }, [translatedText, inputText, sourceLang, targetLang, showTranslation]);

  // Special check for empty input
  useEffect(() => {
    if (!inputText || inputText.trim() === "") {
      forceCleanup();
    }
  }, [inputText]);

  // Get appropriate colors for current languages
  const sourceColor = langColors[sourceLang] || langColors.en;
  const targetColor = langColors[targetLang] || langColors.es;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden">
        {/* Glass effect header */}
        <div className="relative -m-6 mb-4 p-6 pb-4 bg-gradient-to-r from-purple-600 to-blue-500">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 rounded-t-lg"></div>
          <h1 className="text-3xl font-bold text-white mb-1 relative z-10">
            Lingoly
          </h1>
          <p className="text-white text-opacity-90 font-light relative z-10">
            Speech Translation Studio
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-8">
          <div className="flex-1 relative">
            <div
              className={`absolute -top-3 left-3 z-10 px-2 ${sourceColor.bg} text-white text-xs font-bold uppercase tracking-wider rounded-full`}
            >
              Source
            </div>
            <select
              value={sourceLang}
              onChange={handleSourceLangChange}
              className="w-full p-3 pt-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-offset-2 focus:outline-none shadow-sm transition-all duration-300"
              style={{ borderRadius: "16px" }}
            >
              {languages.map((lang) => (
                <option key={`source-${lang.code}`} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Languages Button */}
          <div className="flex items-center justify-center -my-1">
            <button
              onClick={swapLanguages}
              className="p-3 bg-white hover:bg-gray-50 text-gray-800 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:rotate-180 z-20 border border-gray-100"
              title="Swap Languages"
              aria-label="Swap source and target languages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 relative">
            <div
              className={`absolute -top-3 left-3 z-10 px-2 ${targetColor.bg} text-white text-xs font-bold uppercase tracking-wider rounded-full`}
            >
              Target
            </div>
            <select
              value={targetLang}
              onChange={handleTargetLangChange}
              className="w-full p-3 pt-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-offset-2 focus:outline-none shadow-sm transition-all duration-300"
              style={{ borderRadius: "16px" }}
            >
              {languages.map((lang) => (
                <option key={`target-${lang.code}`} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Input  */}
        <div className="mb-6 relative">
          <div
            className={`absolute top-4 left-4 z-10 ${sourceColor.text} text-sm font-bold uppercase`}
          >
            {languages.find((l) => l.code === sourceLang)?.name}
          </div>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type or record text to translate..."
            className={`w-full p-4 pt-10 pr-12 min-h-24 border-0 ${sourceColor.light} ${sourceColor.text} rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm resize-none transition-all duration-300`}
            style={{ borderRadius: "16px" }}
          />
          <button
            onClick={handleRecord}
            className={`absolute right-3 bottom-3 p-3 rounded-full text-white transition duration-300 ${
              isRecording ? "bg-red-500 animate-pulse" : sourceColor.bg
            }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Target Translation Box  */}
        {inputText &&
          inputText.trim() !== "" &&
          showTranslation &&
          translatedText &&
          translatedText.trim() !== "" && (
            <div className="relative mb-6">
              <div
                className={`absolute top-4 left-4 z-10 ${targetColor.text} text-sm font-bold uppercase`}
              >
                {languages.find((l) => l.code === targetLang)?.name}
              </div>
              <div
                className={`w-full p-4 pt-10 pr-12 min-h-24 ${targetColor.light} ${targetColor.text} rounded-xl shadow-sm relative`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-16 space-x-2">
                    <div className="w-3 h-3 rounded-full animate-pulse bg-gray-400"></div>
                    <div
                      className="w-3 h-3 rounded-full animate-pulse bg-gray-400"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full animate-pulse bg-gray-400"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                ) : (
                  <p className="text-gray-800 break-words">{translatedText}</p>
                )}
                <button
                  onClick={() => speakText(translatedText, targetLang)}
                  className={`absolute right-3 bottom-3 p-3 rounded-full ${targetColor.bg} text-white hover:opacity-90 transition-opacity`}
                  title="Speak"
                  disabled={!translatedText}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* Synonyms */}
        {Object.keys(synonyms).length > 0 && showTranslation && (
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-4">
            <h2 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 11l-5-5m0 0l-5 5m5-5v12"
                />
              </svg>
              Synonyms
            </h2>
            {/* Display source language synonyms first if available */}
            {synonyms[sourceLang] && (
              <div className="mb-3">
                <p className={`font-medium ${sourceColor.text} text-sm mb-2`}>
                  {languages.find((l) => l.code === sourceLang)?.name}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {synonyms[sourceLang].map((syn, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 bg-white border border-gray-200 ${sourceColor.text} rounded-full text-sm shadow-sm hover:bg-gray-50 transition duration-200`}
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Then display target language synonyms if available */}
            {synonyms[targetLang] && (
              <div className="mb-3">
                <p className={`font-medium ${targetColor.text} text-sm mb-2`}>
                  {languages.find((l) => l.code === targetLang)?.name}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {synonyms[targetLang].map((syn, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 bg-white border border-gray-200 ${targetColor.text} rounded-full text-sm shadow-sm hover:bg-gray-50 transition duration-200`}
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Definitions */}
        {Object.keys(definitions).length > 0 && showTranslation && (
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <h2 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Definitions
            </h2>
            {Object.entries(definitions).map(([lang, defs]) => {
              const color = langColors[lang] || langColors.en;
              return (
                <div key={lang} className="mb-3">
                  <p className={`font-medium ${color.text} text-sm mb-2`}>
                    {languages.find((l) => l.code === lang)?.name}:
                  </p>
                  <ul className="space-y-2">
                    {defs.map((def, idx) => (
                      <li
                        key={idx}
                        className={`text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm`}
                      >
                        {def}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
