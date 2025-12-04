import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Shuffle,
  List,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  correctCount: number;
  incorrectCount: number;
  lastResult: "correct" | "incorrect" | null;
}

interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      duration: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

const cardVariants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 },
};

const FlashcardApp = () => {
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem("flashcardDecks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newDeckName, setNewDeckName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ question: "", answer: "" });
  const [studyMode, setStudyMode] = useState<"all" | "incorrect">("all");
  const [displayMode, setDisplayMode] = useState<"all" | "incorrect">("all");
  const [shuffleMode, setShuffleMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [combinedDeckIds, setCombinedDeckIds] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Computed flag for displaying cards (single or combined)
  const shouldShowCards = selectedDeckId || combinedDeckIds.length > 0;

  // Persist decks to localStorage with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("flashcardDecks", JSON.stringify(decks));
    }, 300);
    return () => clearTimeout(handler);
  }, [decks]);

  // Resize listener with debounce
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Debounced resize handler
    let timeoutId: number | null = null;
    const debouncedHandleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Get current cards based on selection mode
  const currentCards = useMemo(() => {
    if (combinedDeckIds.length > 0) {
      return decks
        .filter((d) => combinedDeckIds.includes(d.id))
        .flatMap((d) => d.cards);
    } else if (selectedDeckId) {
      const deck = decks.find((d) => d.id === selectedDeckId);
      return deck ? deck.cards : [];
    }
    return [];
  }, [decks, selectedDeckId, combinedDeckIds]);

  // Filtered cards for display based on display mode
  const filteredDisplayCards = useMemo(() => {
    if (displayMode === "incorrect") {
      return currentCards.filter(
        (c) => c.lastResult === "incorrect" || c.incorrectCount > c.correctCount
      );
    }
    return currentCards;
  }, [currentCards, displayMode]);

  // Get study cards based on mode and shuffle preference
  const studyCards = useMemo(() => {
    let cards = [...currentCards];
    if (studyMode === "incorrect") {
      cards = cards.filter(
        (c) => c.lastResult === "incorrect" || c.incorrectCount > c.correctCount
      );
    }
    return shuffleMode ? [...cards].sort(() => Math.random() - 0.5) : cards;
  }, [currentCards, studyMode, shuffleMode]);

  // Get current deck name (either selected or combined)
  const currentDeckName = useMemo(() => {
    if (combinedDeckIds.length > 0) {
      return decks
        .filter((d) => combinedDeckIds.includes(d.id))
        .map((d) => d.name)
        .join(" + ");
    } else if (selectedDeckId) {
      const deck = decks.find((d) => d.id === selectedDeckId);
      return deck ? deck.name : "";
    }
    return "";
  }, [decks, selectedDeckId, combinedDeckIds]);

  // Create a new deck
  const handleCreateDeck = useCallback(() => {
    if (!newDeckName.trim()) return;
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: newDeckName.trim(),
      cards: [],
    };
    setDecks((prev) => [...prev, newDeck]);
    setNewDeckName("");
  }, [newDeckName]);

  // Delete a deck
  const handleDeleteDeck = useCallback(
    (deckId: string) => {
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (selectedDeckId === deckId) setSelectedDeckId(null);
      setCombinedDeckIds((prev) => prev.filter((id) => id !== deckId));
    },
    [selectedDeckId]
  );

  // Add a new card to the current deck context (single or combined)
  const handleAddCard = useCallback(() => {
    if (!newCard.question.trim() || !newCard.answer.trim()) return;

    const card: Flashcard = {
      id: crypto.randomUUID(),
      question: newCard.question.trim(),
      answer: newCard.answer.trim(),
      correctCount: 0,
      incorrectCount: 0,
      lastResult: null,
    };

    if (selectedDeckId) {
      // Add to selected single deck
      setDecks((prev) =>
        prev.map((d) =>
          d.id === selectedDeckId ? { ...d, cards: [...d.cards, card] } : d
        )
      );
    } else if (combinedDeckIds.length === 1) {
      // If only one deck is in the combined selection, add to that deck
      setDecks((prev) =>
        prev.map((d) =>
          d.id === combinedDeckIds[0] ? { ...d, cards: [...d.cards, card] } : d
        )
      );
    }

    setNewCard({ question: "", answer: "" });
  }, [selectedDeckId, combinedDeckIds, newCard]);

  // Delete a card
  const handleDeleteCard = useCallback((cardId: string) => {
    setDecks((prev) =>
      prev.map((d) => {
        // Check if this deck contains the card
        const cardIndex = d.cards.findIndex((c) => c.id === cardId);
        if (cardIndex !== -1) {
          // Create a new cards array without this card
          const newCards = [...d.cards];
          newCards.splice(cardIndex, 1);
          return { ...d, cards: newCards };
        }
        return d;
      })
    );
  }, []);

  // Record study result for a card
  const handleStudyResult = useCallback(
    (cardId: string, isCorrect: boolean) => {
      const result = isCorrect ? "correct" : "incorrect";
      setDecks((prev) =>
        prev.map((d) => ({
          ...d,
          cards: d.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  lastResult: result,
                  correctCount: isCorrect ? c.correctCount + 1 : c.correctCount,
                  incorrectCount: !isCorrect
                    ? c.incorrectCount + 1
                    : c.incorrectCount,
                }
              : c
          ),
        }))
      );
      setShowAnswer(false);
      setCurrentCardIndex((prev) => prev + 1);
    },
    []
  );

  // Navigate through cards
  const navigateCards = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && currentCardIndex > 0) {
        setCurrentCardIndex((prev) => prev - 1);
        setShowAnswer(false);
      } else if (
        direction === "next" &&
        currentCardIndex < studyCards.length - 1
      ) {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      }
    },
    [currentCardIndex, studyCards.length]
  );

  // Reset study progress
  const resetStudy = useCallback(() => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsStudyActive(false);
  }, []);

  // Toggle deck combination for study
  const toggleDeckCombination = useCallback((deckId: string) => {
    setCombinedDeckIds((prev) => {
      const newIds = prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId];

      // If we're selecting a deck for combination, deselect any single deck
      if (!prev.includes(deckId) && prev.length === 0) {
        setSelectedDeckId(null);
      }

      return newIds;
    });
  }, []);

  // Determine if a deck is the selected one
  const isDeckSelected = useCallback(
    (deckId: string) => {
      return selectedDeckId === deckId;
    },
    [selectedDeckId]
  );

  // Determine if a deck is combined
  const isDeckCombined = useCallback(
    (deckId: string) => {
      return combinedDeckIds.includes(deckId);
    },
    [combinedDeckIds]
  );

  // Handle deck selection, accounting for combined mode
  const handleDeckSelect = useCallback(
    (deckId: string) => {
      if (combinedDeckIds.length > 0) {
        // If we're in combined mode and clicking a deck,
        // exit combined mode and select this deck
        setCombinedDeckIds([]);
        setSelectedDeckId(deckId);
      } else {
        // Standard toggle
        setSelectedDeckId((prev) => (prev === deckId ? null : deckId));
      }
      // Reset filters when selecting a new deck
      setDisplayMode("all");
    },
    [combinedDeckIds.length]
  );

  // Toggle display mode between all and incorrect cards
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => (prev === "all" ? "incorrect" : "all"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-4">
      <motion.div
        className="max-w-4xl mx-auto space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="text-center p-4 backdrop-blur-sm bg-white/10 rounded-xl shadow-lg"
          variants={itemVariants}
          layout="position"
        >
          <h1 className="text-3xl font-bold text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-indigo-300">
              Flashcard Study Tool
            </span>
          </h1>
        </motion.div>

        {/* Deck Creation */}
        <motion.div
          className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-4"
          variants={itemVariants}
          layout="position"
        >
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="New Deck Name"
              className="w-full flex-1 p-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/20 text-white placeholder-white/60"
            />
            <button
              onClick={handleCreateDeck}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-3 py-2 rounded-lg hover:from-pink-600 hover:to-indigo-600 shadow-md"
            >
              <Plus size={18} /> Create
            </button>
          </div>
        </motion.div>

        {/* Deck Selection */}
        <motion.div
          className="space-y-2"
          variants={itemVariants}
          layout="position"
        >
          <h2 className="text-xl font-semibold text-white">Your Decks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {decks.map((deck) => (
              <motion.div
                key={deck.id}
                className={`p-3 backdrop-blur-sm rounded-xl shadow-lg cursor-pointer border-2 transition duration-200 transform hover:scale-102 ${
                  isDeckSelected(deck.id)
                    ? "border-pink-400 bg-white/30"
                    : isDeckCombined(deck.id)
                    ? "border-indigo-400 bg-indigo-800/30"
                    : "border-transparent bg-white/10"
                }`}
                onClick={() => handleDeckSelect(deck.id)}
                layout="position"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "tween", duration: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <h3 className="font-medium text-lg text-white mb-2 sm:mb-0">
                    {deck.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck.id);
                      }}
                      className="text-red-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeckCombination(deck.id);
                      }}
                      className={`px-2 py-1 rounded-lg text-sm transition-colors ${
                        isDeckCombined(deck.id)
                          ? "bg-indigo-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      Combine
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  {deck.cards.length} cards
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Current Deck Header, unified for both single and combined decks */}
        {shouldShowCards && !isStudyActive && (
          <motion.div
            className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-4"
            variants={itemVariants}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            layout="position"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                {combinedDeckIds.length > 0 ? <BookOpen size={18} /> : null}
                {currentDeckName}
                <span className="text-white/70 text-sm font-normal ml-2">
                  {currentCards.length} cards
                </span>
              </h2>
            </div>
          </motion.div>
        )}

        {/* Card Creation for Selected Deck, shown for single deck or when exactly one deck is combined */}
        {shouldShowCards && !isStudyActive && combinedDeckIds.length <= 1 && (
          <motion.div
            className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-4 space-y-3"
            variants={itemVariants}
            layout="position"
          >
            <h2 className="text-xl font-semibold text-white">Add Card</h2>
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <div className="flex-1">
                <label className="block text-white/80 text-sm mb-1">
                  Question
                </label>
                <textarea
                  value={newCard.question}
                  onChange={(e) =>
                    setNewCard((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  placeholder="Front of card"
                  className="w-full p-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/20 text-white placeholder-white/60 h-24 resize-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white/80 text-sm mb-1">
                  Answer
                </label>
                <textarea
                  value={newCard.answer}
                  onChange={(e) =>
                    setNewCard((prev) => ({ ...prev, answer: e.target.value }))
                  }
                  placeholder="Back of card"
                  className="w-full p-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/20 text-white placeholder-white/60 h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddCard}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md w-full md:w-auto"
              >
                <Plus size={18} /> Add Card
              </button>
            </div>
          </motion.div>
        )}

        {/* Study Mode Controls, shown for both single and combined decks */}
        {shouldShowCards && !isStudyActive && (
          <motion.div
            className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-3 space-y-3"
            variants={itemVariants}
            layout="position"
          >
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStudyMode("all")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    studyMode === "all"
                      ? "bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Study All Cards
                </button>
                <button
                  onClick={() => setStudyMode("incorrect")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    studyMode === "incorrect"
                      ? "bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Study Incorrect Only
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShuffleMode((prev) => !prev)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    shuffleMode
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {shuffleMode ? <Shuffle size={16} /> : <List size={16} />}
                  {shuffleMode ? "Shuffle" : "In Order"}
                </button>

                {currentCards.length > 0 && (
                  <button
                    onClick={() => setIsStudyActive(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 shadow-md"
                  >
                    Study Cards
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Study Session */}
        <AnimatePresence mode="wait">
          {isStudyActive &&
            studyCards.length > 0 &&
            currentCardIndex < studyCards.length && (
              <motion.div
                key="study-session"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="relative"
                layout="position"
              >
                <div className="absolute top-2 left-4 right-4 z-10">
                  <div className="text-center text-white mb-1">
                    Card {currentCardIndex + 1} of {studyCards.length}
                    {studyMode === "incorrect" && (
                      <span className="ml-2 text-orange-300">
                        (Incorrect Only)
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-indigo-500 h-2 rounded-full"
                      style={{
                        width: `${
                          ((currentCardIndex + 1) / studyCards.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <motion.div
                  key={currentCardIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-xl shadow-xl overflow-hidden pt-10 pb-4 px-4 mt-8"
                  layout="position"
                >
                  {/* Card container */}
                  <div className="perspective-1000 relative w-full mx-auto">
                    {/* Responsive aspect ratio container */}
                    <div className="w-full pb-[60%] relative sm:w-5/6 sm:mx-auto md:w-3/4">
                      <motion.div
                        animate={showAnswer ? "back" : "front"}
                        variants={cardVariants}
                        transition={{ duration: 0.4 }}
                        style={{
                          transformStyle: "preserve-3d",
                          backfaceVisibility: "hidden",
                          position: "absolute",
                          inset: 0,
                          willChange: "transform",
                        }}
                        className="w-full h-full will-change-transform"
                      >
                        {/* Front of card */}
                        <motion.div
                          className={`absolute inset-0 p-4 rounded-xl flex flex-col items-center justify-center ${
                            showAnswer ? "opacity-0" : "opacity-100"
                          } bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 shadow-lg will-change-transform`}
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <p className="text-xl font-medium text-white text-center">
                            {studyCards[currentCardIndex].question}
                          </p>
                        </motion.div>

                        {/* Back of card */}
                        <motion.div
                          className={`absolute inset-0 p-4 rounded-xl flex flex-col items-center justify-center ${
                            showAnswer ? "opacity-100" : "opacity-0"
                          } bg-gradient-to-br from-pink-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20 shadow-lg will-change-transform`}
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <p className="text-lg text-white text-center">
                            {studyCards[currentCardIndex].answer}
                          </p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Study Controls */}
                  <div className="flex flex-wrap justify-between items-center mt-4 px-2">
                    <button
                      onClick={() => navigateCards("prev")}
                      disabled={currentCardIndex === 0}
                      className={`p-2 rounded-full order-1 ${
                        currentCardIndex === 0
                          ? "bg-white/10 text-white/30"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center order-3 sm:order-2 w-full sm:w-auto my-3 sm:my-0">
                      {!showAnswer ? (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors shadow-md w-full sm:w-auto"
                        >
                          Show Answer
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleStudyResult(
                                studyCards[currentCardIndex].id,
                                true
                              )
                            }
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md w-full sm:w-auto"
                          >
                            <CheckCircle size={18} /> Correct
                          </button>
                          <button
                            onClick={() =>
                              handleStudyResult(
                                studyCards[currentCardIndex].id,
                                false
                              )
                            }
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 shadow-md w-full sm:w-auto"
                          >
                            <XCircle size={18} /> Incorrect
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => navigateCards("next")}
                      disabled={currentCardIndex === studyCards.length - 1}
                      className={`p-2 rounded-full order-2 sm:order-3 ${
                        currentCardIndex === studyCards.length - 1
                          ? "bg-white/10 text-white/30"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          {isStudyActive && studyCards.length === 0 && (
            <motion.div
              key="no-cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-6 text-center"
              layout="position"
            >
              <p className="text-white text-lg">
                No cards to study in this mode.
              </p>
              <button
                onClick={resetStudy}
                className="mt-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 shadow-md"
              >
                Back to Decks
              </button>
            </motion.div>
          )}
          {isStudyActive &&
            currentCardIndex >= studyCards.length &&
            studyCards.length > 0 && (
              <motion.div
                key="study-complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-6 text-center"
                layout="position"
              >
                <p className="text-xl font-semibold text-white mb-3">
                  Study Session Complete!
                </p>
                <button
                  onClick={resetStudy}
                  className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 shadow-md"
                >
                  Back to Decks
                </button>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Display Cards for Current Content with display mode filtering */}
        {shouldShowCards && !isStudyActive && (
          <motion.div
            className="backdrop-blur-sm bg-white/10 rounded-xl shadow-lg p-4 space-y-3"
            variants={itemVariants}
            layout="position"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-xl font-semibold text-white mb-2 sm:mb-0">
                Cards {combinedDeckIds.length > 0 ? `(${currentDeckName})` : ""}
              </h2>
              <div className="flex flex-wrap gap-2 items-center self-start sm:self-center">
                <button
                  onClick={() => setDisplayMode("all")}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                    displayMode === "all"
                      ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <Filter size={14} /> All
                </button>
                <button
                  onClick={() => setDisplayMode("incorrect")}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                    displayMode === "incorrect"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <XCircle size={14} /> Incorrect
                </button>
              </div>
            </div>

            {filteredDisplayCards.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                {currentCards.length === 0
                  ? "No cards yet. Add your first card above!"
                  : displayMode === "incorrect"
                  ? "No incorrect cards to display. Great job!"
                  : "No cards to display."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredDisplayCards.map((card) => (
                  <motion.div
                    key={card.id}
                    className={`rounded-lg border border-white/20 ${
                      card.lastResult === "incorrect"
                        ? "bg-gradient-to-br from-red-900/30 to-red-800/30"
                        : card.lastResult === "correct"
                        ? "bg-gradient-to-br from-green-900/30 to-green-800/30"
                        : "bg-gradient-to-br from-gray-800/40 to-gray-900/40"
                    } backdrop-blur-sm shadow-md flex flex-col justify-between overflow-hidden`}
                    layout="position"
                    variants={itemVariants}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-3 flex-grow">
                      <p className="font-medium text-white">{card.question}</p>
                      <p className="text-sm text-white/70 mt-2">
                        {card.answer}
                      </p>
                    </div>
                    <div className="bg-black/20 p-2 flex justify-between items-center">
                      <div className="text-xs text-white/60">
                        <span className="inline-flex items-center gap-1 mr-2">
                          <CheckCircle size={14} className="text-green-400" />{" "}
                          {card.correctCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <XCircle size={14} className="text-red-400" />{" "}
                          {card.incorrectCount}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FlashcardApp;
