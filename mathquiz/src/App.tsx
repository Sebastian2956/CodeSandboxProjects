import React, { useState, useReducer, useMemo, useEffect } from "react";

interface Problem {
  id: string;
  a: number;
  b: number;
  operation: string;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

interface Sticker {
  id: number;
  icon: string;
  count: number;
}

interface State {
  stickers: Sticker[];
  problemHistory: Problem[];
  problemsCorrect: number;
  problemsWrong: number;
}

type Action =
  | { type: "ADD_STICKER"; payload: number }
  | { type: "ADD_PROBLEM_RESULT"; payload: Problem }
  | { type: "CLEAR_WRONG_PROBLEMS" };

const stickerIcons = ["🦁", "🐶", "🐱", "🦊", "🐼"];
const PROBLEMS_PER_STICKER = 10;

const initialState: State = {
  stickers: [],
  problemHistory: [],
  problemsCorrect: 0,
  problemsWrong: 0,
};

// Reducer function
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_STICKER": {
      const stickerId = action.payload;
      const existing = state.stickers.find((s) => s.id === stickerId);
      return {
        ...state,
        stickers: existing
          ? state.stickers.map((s) =>
              s.id === stickerId ? { ...s, count: s.count + 1 } : s
            )
          : [
              ...state.stickers,
              { id: stickerId, icon: stickerIcons[stickerId - 1], count: 1 },
            ],
      };
    }
    case "ADD_PROBLEM_RESULT": {
      const problem = action.payload;
      const existingProblemIndex = state.problemHistory.findIndex(
        (p) =>
          p.a === problem.a &&
          p.b === problem.b &&
          p.operation === problem.operation
      );

      let newHistory;
      if (
        existingProblemIndex >= 0 &&
        !state.problemHistory[existingProblemIndex].isCorrect &&
        problem.isCorrect
      ) {
        // Replace the wrong problem with the correct one
        newHistory = [...state.problemHistory];
        newHistory[existingProblemIndex] = problem;
      } else {
        // Add as a new problem
        newHistory = [...state.problemHistory, problem];
      }

      return {
        ...state,
        problemHistory: newHistory,
        problemsCorrect: problem.isCorrect
          ? state.problemsCorrect + 1
          : state.problemsCorrect,
        problemsWrong: !problem.isCorrect
          ? state.problemsWrong + 1
          : state.problemsWrong,
      };
    }
    case "CLEAR_WRONG_PROBLEMS":
      return {
        ...state,
        problemHistory: state.problemHistory.filter((p) => p.isCorrect),
      };
    default:
      return state;
  }
};

// Generate a math problem
const generateProblem = (
  minRange: number,
  maxRange: number,
  operations: string[]
): Problem | null => {
  if (operations.length === 0) return null;

  const operation = operations[Math.floor(Math.random() * operations.length)];
  // Get random numbers within the range
  let a = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
  let b = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;

  if (operation === "-") {
    // For subtraction, ensure a ≥ b to avoid negative results
    if (a < b) [a, b] = [b, a];
  }
  if (operation === "/") {
    // For division, ensure clean division with no remainder
    b = Math.max(1, Math.min(b, 10)); // Limit divisors for simplicity
    a =
      b *
      (Math.floor(Math.random() * Math.max(1, Math.floor(maxRange / b))) + 1);
  }

  const answer =
    operation === "+"
      ? a + b
      : operation === "-"
      ? a - b
      : operation === "*"
      ? a * b
      : Math.floor(a / b);

  return {
    id: `${a}${operation}${b}-${Date.now()}`,
    a,
    b,
    operation,
    answer,
  };
};

const App = () => {
  const [problemTypes, setProblemTypes] = useState({
    addition: true,
    subtraction: false,
    multiplication: false,
    division: false,
  });
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(10);
  const [answer, setAnswer] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState<"quiz" | "stickers" | "history">("quiz");
  const [showHint, setShowHint] = useState(false);
  const [hintModal, setHintModal] = useState(false);
  const [wrongAnswerModal, setWrongAnswerModal] = useState<Problem | null>(
    null
  );
  const [celebration, setCelebration] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [wrongProblemIndex, setWrongProblemIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Check for mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get active operations from problem types
  const activeOperations = useMemo(
    () =>
      Object.entries(problemTypes)
        .filter(([, enabled]) => enabled)
        .map(([key]) =>
          key === "addition"
            ? "+"
            : key === "subtraction"
            ? "-"
            : key === "multiplication"
            ? "*"
            : "/"
        ),
    [problemTypes]
  );

  // Current problem state
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(() =>
    generateProblem(minRange, maxRange, activeOperations)
  );

  // Update problem when settings change
  useEffect(() => {
    if (!practiceMode && activeOperations.length > 0) {
      setCurrentProblem(generateProblem(minRange, maxRange, activeOperations));
    }
  }, [activeOperations, minRange, maxRange, practiceMode]);

  // Get wrong problems for practice
  const wrongProblems = useMemo(
    () => state.problemHistory.filter((p) => !p.isCorrect),
    [state.problemHistory]
  );

  // Start practice mode with wrong problems
  const practiceMistakes = () => {
    if (wrongProblems.length > 0) {
      setPracticeMode(true);
      setWrongProblemIndex(0);
      loadNextWrongProblem(0);
      setTab("quiz");
    }
  };

  // Load next wrong problem for practice
  const loadNextWrongProblem = (index: number) => {
    if (index < wrongProblems.length) {
      const problem = {
        ...wrongProblems[index],
        id: `${wrongProblems[index].a}${wrongProblems[index].operation}${
          wrongProblems[index].b
        }-${Date.now()}`,
      };
      delete problem.userAnswer;
      delete problem.isCorrect;
      setCurrentProblem(problem);
    } else {
      // All wrong problems practiced, return to normal mode
      setPracticeMode(false);
      setCurrentProblem(generateProblem(minRange, maxRange, activeOperations));
    }
  };

  // Handle answer submission
  const handleAnswer = () => {
    if (!currentProblem || !answer) return;

    const userAnswer = parseInt(answer);
    const isCorrect = userAnswer === currentProblem.answer;

    // Add result to problem history
    const completedProblem = {
      ...currentProblem,
      userAnswer,
      isCorrect,
    };

    dispatch({ type: "ADD_PROBLEM_RESULT", payload: completedProblem });

    if (isCorrect) {
      // Celebration effect
      setCelebration(true);
      setTimeout(() => setCelebration(false), 1500);

      // Award sticker every 10 correct problems
      if (
        state.problemsCorrect > 0 &&
        (state.problemsCorrect + 1) % PROBLEMS_PER_STICKER === 0
      ) {
        const stickerId = Math.floor(Math.random() * 5) + 1;
        dispatch({ type: "ADD_STICKER", payload: stickerId });
      }
    } else {
      // Show wrong answer modal
      setWrongAnswerModal(completedProblem);
    }

    // Generate new problem or move to next wrong problem
    if (practiceMode) {
      const nextIndex = wrongProblemIndex + 1;
      setWrongProblemIndex(nextIndex);
      loadNextWrongProblem(nextIndex);
    } else {
      setCurrentProblem(generateProblem(minRange, maxRange, activeOperations));
    }

    setAnswer("");
    setShowHint(false);
    setHintModal(false);
  };

  // Render visual hint based on operation type
  const renderHint = (problem: Problem) => {
    const { a, b, operation } = problem;

    if (operation === "+") {
      return (
        <div className="text-center">
          <p>Number Line:</p>
          <div className="w-full h-6 bg-gray-200 relative mt-2 mb-4 rounded-full">
            {[...Array(Math.min(a + b + 1, 20)).keys()].map((i) => {
              const normalizedValue = i * ((a + b) / Math.min(a + b, 19));
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${(normalizedValue / (a + b)) * 100}%` }}
                >
                  <div className="w-1 h-4 bg-gray-400 mb-1"></div>
                  <span className="text-xs">{Math.floor(normalizedValue)}</span>
                </div>
              );
            })}
            <div
              className="absolute h-3 bg-blue-500 rounded-full"
              style={{
                left: `0%`,
                width: `${(a / (a + b)) * 100}%`,
              }}
            ></div>
            <div
              className="absolute h-3 bg-green-500 rounded-full"
              style={{
                left: `${(a / (a + b)) * 100}%`,
                width: `${(b / (a + b)) * 100}%`,
              }}
            ></div>
          </div>
          <p>
            Start at {a}, add {b} more.
          </p>
        </div>
      );
    } else if (operation === "-") {
      return (
        <div className="text-center">
          <p>Number Line:</p>
          <div className="w-full h-6 bg-gray-200 relative mt-2 mb-4 rounded-full">
            {[...Array(Math.min(a + 1, 20)).keys()].map((i) => {
              const normalizedValue = i * (a / Math.min(a, 19));
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${(normalizedValue / a) * 100}%` }}
                >
                  <div className="w-1 h-4 bg-gray-400 mb-1"></div>
                  <span className="text-xs">{Math.floor(normalizedValue)}</span>
                </div>
              );
            })}
            <div
              className="absolute h-3 bg-blue-500 rounded-full"
              style={{
                left: `0%`,
                width: `100%`,
              }}
            ></div>
            <div
              className="absolute h-3 bg-red-500 rounded-full"
              style={{
                left: `${((a - b) / a) * 100}%`,
                width: `${(b / a) * 100}%`,
              }}
            ></div>
          </div>
          <p>
            Start at {a}, take away {b}.
          </p>
        </div>
      );
    } else if (operation === "*") {
      // Create grid for multiplication (limited size for large numbers)
      const limitedA = Math.min(a, 10);
      const limitedB = Math.min(b, 10);
      const rows = [];
      for (let i = 0; i < limitedA; i++) {
        const row = [];
        for (let j = 0; j < limitedB; j++) {
          row.push(
            <div key={j} className="w-3 h-3 bg-blue-500 rounded-full m-1"></div>
          );
        }
        rows.push(
          <div key={i} className="flex flex-wrap justify-center">
            {row}
          </div>
        );
      }

      return (
        <div className="text-center">
          <p>Groups of Dots:</p>
          <div className="flex justify-center mt-2 mb-2">
            <div>{rows}</div>
          </div>
          <p>
            {a > limitedA || b > limitedB ? "(Showing a smaller example) " : ""}
            {a} rows of {b} dots = {a} × {b}
          </p>
        </div>
      );
    } else {
      // Division visualization
      const limitedB = Math.min(b, 6);
      const limitedQuotient = Math.min(Math.floor(a / b), 8);
      const rows = [];
      for (let i = 0; i < limitedB; i++) {
        const row = [];
        for (let j = 0; j < limitedQuotient; j++) {
          row.push(
            <div key={j} className="w-3 h-3 bg-blue-500 rounded-full m-1"></div>
          );
        }
        rows.push(
          <div key={i} className="border border-dashed border-gray-300 p-1 m-1">
            <div className="flex flex-wrap justify-center">{row}</div>
          </div>
        );
      }

      return (
        <div className="text-center">
          <p>
            {b > limitedB || limitedQuotient < Math.floor(a / b)
              ? "(Showing a smaller example) "
              : ""}
            Share {a} dots into {b} equal groups:
          </p>
          <div className="flex justify-center flex-wrap mt-2 mb-2">{rows}</div>
          <p>Each group has {Math.floor(a / b)} dots</p>
        </div>
      );
    }
  };

  // Get operation symbol for display
  const getOperationSymbol = (op: string) => {
    return op === "*" ? "×" : op === "/" ? "÷" : op;
  };

  // Get operation label
  const getOperationLabel = (key: string, mobile: boolean) => {
    if (mobile) {
      return key === "addition"
        ? "+"
        : key === "subtraction"
        ? "-"
        : key === "multiplication"
        ? "×"
        : "÷";
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-200 to-blue-300 p-4 md:p-6">
      <div className="max-w-2xl mx-auto relative">
        {/* Celebration effect */}
        {celebration && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="absolute inset-0 flex">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="text-4xl animate-bounce"
                  style={{
                    position: "absolute",
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${0.5 + Math.random() * 1}s`,
                  }}
                >
                  {
                    ["🎉", "⭐", "🎊", "🌟", "👏"][
                      Math.floor(Math.random() * 5)
                    ]
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white drop-shadow-lg">
          Math Fun for Kids!
        </h1>

        {/* Problem Type Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {Object.entries(problemTypes).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-center space-x-2 bg-white bg-opacity-90 p-2 sm:p-3 rounded-xl shadow-lg transform hover:scale-105 transition-transform cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={() =>
                  setProblemTypes({ ...problemTypes, [key]: !value })
                }
                className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600"
              />
              <span className="font-semibold text-indigo-800 text-sm sm:text-base">
                {getOperationLabel(key, isMobile)}
              </span>
            </label>
          ))}
        </div>

        {/* Range Sliders */}
        <div className="mb-6 bg-white bg-opacity-90 p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="mb-4">
            <label className="block mb-2 font-medium text-indigo-800 text-sm sm:text-base">
              Min Number: <span className="font-bold">{minRange}</span>
            </label>
            <input
              type="range"
              min="1"
              max={maxRange - 1}
              value={minRange}
              onChange={(e) => setMinRange(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 text-xs text-indigo-600">
              <span>1</span>
              <span>{maxRange - 1}</span>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-indigo-800 text-sm sm:text-base">
              Max Number: <span className="font-bold">{maxRange}</span>
            </label>
            <input
              type="range"
              min={minRange + 1}
              max="50"
              value={maxRange}
              onChange={(e) => setMaxRange(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 text-xs text-indigo-600">
              <span>{minRange + 1}</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setTab("quiz")}
            className={`flex-1 p-2 sm:p-3 rounded-tl-xl rounded-tr-none text-base sm:text-lg font-medium transition-colors ${
              tab === "quiz"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white bg-opacity-70 text-indigo-800 hover:bg-opacity-80"
            }`}
          >
            Quiz
          </button>
          <button
            onClick={() => setTab("stickers")}
            className={`flex-1 p-2 sm:p-3 text-base sm:text-lg font-medium transition-colors ${
              tab === "stickers"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white bg-opacity-70 text-indigo-800 hover:bg-opacity-80"
            }`}
          >
            {isMobile
              ? "🎖️"
              : `Stickers (${state.stickers.reduce(
                  (sum, s) => sum + s.count,
                  0
                )})`}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 p-2 sm:p-3 rounded-tr-xl rounded-tl-none text-base sm:text-lg font-medium transition-colors ${
              tab === "history"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white bg-opacity-70 text-indigo-800 hover:bg-opacity-80"
            }`}
          >
            {isMobile ? "📋" : "History"}
          </button>
        </div>

        {/* Content based on selected tab */}
        {tab === "quiz" && (
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl shadow-lg border-2 border-indigo-200">
            {currentProblem ? (
              <>
                <p className="text-3xl sm:text-4xl text-center mb-4 sm:mb-6 font-bold text-indigo-800">
                  {currentProblem.a}{" "}
                  {getOperationSymbol(currentProblem.operation)}{" "}
                  {currentProblem.b} = ?
                </p>
                <div className="flex flex-col sm:flex-row items-center mb-6 gap-3 sm:gap-0">
                  <div className="relative w-full">
                    <input
                      type="number"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full p-3 sm:p-4 border-2 border-indigo-300 rounded-xl text-center text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your answer"
                      style={{ appearance: "textfield" }}
                    />
                  </div>
                  <button
                    onClick={handleAnswer}
                    className="w-full sm:w-auto sm:ml-4 bg-gradient-to-r from-green-400 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl hover:from-green-500 hover:to-green-700 transition shadow-md font-bold text-base sm:text-lg disabled:opacity-50"
                    disabled={!answer}
                  >
                    Check
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (isMobile) {
                      setHintModal(true);
                    } else {
                      setShowHint(!showHint);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition mb-4 shadow-md font-semibold"
                >
                  {showHint || hintModal ? "Hide Hint" : "Show Hint"}
                </button>

                {showHint && currentProblem && !isMobile && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 shadow-inner">
                    {renderHint(currentProblem)}
                  </div>
                )}

                {/* Hint Modal for Mobile */}
                {hintModal && currentProblem && isMobile && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-white p-4 rounded-xl shadow-xl m-4 max-w-md w-full border-4 border-yellow-200">
                      <div className="text-right mb-2">
                        <button
                          onClick={() => setHintModal(false)}
                          className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                        >
                          ✕
                        </button>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-center text-indigo-800">
                        Hint
                      </h3>
                      <div className="p-3 bg-yellow-50 rounded-xl border-2 border-yellow-200 shadow-inner">
                        {renderHint(currentProblem)}
                      </div>
                    </div>
                  </div>
                )}

                {practiceMode && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border-2 border-blue-200 text-center shadow-inner">
                    <p className="text-blue-600 font-medium text-sm">
                      Practice mode: Problem {wrongProblemIndex + 1} of{" "}
                      {wrongProblems.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center p-4 text-base sm:text-lg text-indigo-800">
                Please select at least one problem type.
              </p>
            )}

            {/* Stats Counter */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-indigo-100 text-center text-indigo-600">
              <p className="font-medium text-xs sm:text-sm flex flex-wrap justify-center gap-1 sm:gap-2">
                <span>Problems: {state.problemHistory.length}</span>
                <span className="hidden sm:inline">|</span>
                <span className="text-green-600 font-bold">
                  Correct: {state.problemsCorrect}
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="text-red-600 font-bold">
                  Wrong: {state.problemsWrong}
                </span>
              </p>
            </div>
          </div>
        )}

        {tab === "stickers" && (
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl shadow-lg border-2 border-indigo-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-indigo-800">
              Your Sticker Collection
            </h2>
            {state.stickers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {state.stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl shadow-md border-2 border-yellow-200 text-center transform hover:scale-105 transition-transform"
                  >
                    <p className="text-4xl sm:text-5xl mb-2">{sticker.icon}</p>
                    <p className="text-xs sm:text-sm bg-yellow-200 rounded-full px-2 sm:px-3 py-1 inline-block font-bold text-yellow-800">
                      x{sticker.count}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 sm:p-8 bg-yellow-50 rounded-xl border-2 border-yellow-200 shadow-inner">
                <p className="text-base sm:text-lg text-yellow-800 mb-3">
                  No stickers yet!
                </p>
                <p className="text-sm sm:text-md text-indigo-600">
                  Solve {PROBLEMS_PER_STICKER} problems correctly to earn your
                  first sticker!
                </p>
                <div className="text-4xl sm:text-5xl mt-4">🏆</div>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl shadow-lg border-2 border-indigo-200">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-indigo-800">
                Problem History
              </h2>
              {wrongProblems.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={practiceMistakes}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-2 rounded-lg hover:from-orange-500 hover:to-orange-600 transition shadow-md text-sm font-semibold"
                  >
                    Practice Mistakes
                  </button>
                  <button
                    onClick={() => dispatch({ type: "CLEAR_WRONG_PROBLEMS" })}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-red-400 to-red-500 text-white px-3 py-2 rounded-lg hover:from-red-500 hover:to-red-600 transition shadow-md text-sm font-semibold"
                  >
                    Clear Mistakes
                  </button>
                </div>
              )}
            </div>

            {state.problemHistory.length > 0 ? (
              <div className="max-h-60 sm:max-h-80 overflow-y-auto rounded-lg shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-indigo-100">
                        <th className="p-2 sm:p-3 text-left text-indigo-800 font-semibold text-xs sm:text-sm">
                          Problem
                        </th>
                        <th className="p-2 sm:p-3 text-left text-indigo-800 font-semibold text-xs sm:text-sm">
                          Your Answer
                        </th>
                        <th className="p-2 sm:p-3 text-left text-indigo-800 font-semibold text-xs sm:text-sm">
                          Correct
                        </th>
                        <th className="p-2 sm:p-3 text-left text-indigo-800 font-semibold text-xs sm:text-sm">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.problemHistory].reverse().map((problem) => (
                        <tr
                          key={problem.id}
                          className="border-b border-indigo-100 hover:bg-indigo-50"
                        >
                          <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">
                            {problem.a} {getOperationSymbol(problem.operation)}{" "}
                            {problem.b}
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm">
                            {problem.userAnswer}
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm">
                            {problem.answer}
                          </td>
                          <td className="p-2 sm:p-3">
                            <span
                              className={`px-1 sm:px-2 py-1 rounded-full ${
                                problem.isCorrect
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              } font-bold text-xs sm:text-sm`}
                            >
                              {problem.isCorrect ? "✓" : "✗"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 sm:p-8 bg-indigo-50 rounded-xl border-2 border-indigo-200 shadow-inner">
                <p className="text-base sm:text-lg text-indigo-800 mb-3">
                  No problems solved yet!
                </p>
                <p className="text-sm sm:text-md text-indigo-600">
                  Start solving problems to see your history.
                </p>
                <div className="text-4xl sm:text-5xl mt-4">📝</div>
              </div>
            )}
          </div>
        )}

        {/* Wrong Answer Modal */}
        {wrongAnswerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl mx-4 max-w-md w-full border-4 border-red-200">
              <div className="text-center">
                <p className="text-5xl sm:text-6xl mb-2">😕</p>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-red-600">
                  Oops! That's not correct.
                </h3>
                <div className="mb-4 p-3 sm:p-4 bg-red-50 rounded-xl border-2 border-red-200 shadow-inner">
                  <p className="mb-2 text-red-800 text-sm">Problem:</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-800">
                    {wrongAnswerModal.a}{" "}
                    {getOperationSymbol(wrongAnswerModal.operation)}{" "}
                    {wrongAnswerModal.b} = ?
                  </p>
                  <div className="flex justify-between items-center mt-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600">Your answer:</p>
                      <p className="text-lg text-red-600 font-bold">
                        {wrongAnswerModal.userAnswer}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Correct answer:</p>
                      <p className="text-lg text-green-600 font-bold">
                        {wrongAnswerModal.answer}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setWrongAnswerModal(null)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-md font-bold"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
