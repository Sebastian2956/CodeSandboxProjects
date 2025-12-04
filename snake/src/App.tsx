import React, {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

interface Position {
  x: number;
  y: number;
}

interface Bullet extends Position {
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
}

interface BulletDrop extends Position {}

interface SnakeSegment extends Position {
  isJumping?: boolean;
  isUnderJump?: boolean;
  jumpHeight?: number;
}

interface GameState {
  snake: SnakeSegment[];
  food: Position;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  gameStatus: "PLAYING" | "PAUSED" | "GAME_OVER";
  score: number;
  isJumping: boolean;
  jumpPosition: Position | null;
  bullets: Bullet[];
  bulletCount: number;
  foodEatenSinceLastDrop: number;
  bulletDrop: BulletDrop | null;
}

const GRID_SIZE = 20;
const BASE_CELL_SIZE = 20;
const SNAKE_SPEED = 200;
const BULLETS_PER_DROP = 4;
const FOOD_COUNT_FOR_DROP = 4;
const INITIAL_BULLETS = 5;
const JUMP_DURATION = 800;

const initialState: GameState = {
  snake: [{ x: 10, y: 10 }],
  food: { x: 15, y: 15 },
  direction: "RIGHT",
  gameStatus: "PAUSED",
  score: 0,
  isJumping: false,
  jumpPosition: null,
  bullets: [],
  bulletCount: INITIAL_BULLETS,
  foodEatenSinceLastDrop: 0,
  bulletDrop: null,
};

// Helper function to check if two positions are the same
const isSamePosition = (pos1: Position, pos2: Position): boolean =>
  pos1.x === pos2.x && pos1.y === pos2.y;

const gameReducer = (state: GameState, action: any): GameState => {
  switch (action.type) {
    case "MOVE": {
      const head = { ...state.snake[0] };
      // Calculate new head position based on direction
      switch (state.direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Create a new snake array to build
      let newSnake: SnakeSegment[] = [];

      // Check if the head is at the jump position - if so, it should be jumping
      if (
        state.jumpPosition &&
        head.x === state.jumpPosition.x &&
        head.y === state.jumpPosition.y
      ) {
        head.isJumping = true;
      } else {
        head.isJumping = false;
      }

      // Add the head to the new snake
      newSnake.push(head);

      // Process the rest of the snake segments
      for (let i = 0; i < state.snake.length - 1; i++) {
        const segment = { ...state.snake[i] };

        // Check if this segment is at the jump position
        if (
          state.jumpPosition &&
          segment.x === state.jumpPosition.x &&
          segment.y === state.jumpPosition.y
        ) {
          segment.isJumping = true;
        } else {
          segment.isJumping = false;
        }

        newSnake.push(segment);
      }

      // Check if the entire snake has passed the jump point
      // If so, clear the jump position
      let clearJumpPosition = false;
      if (state.jumpPosition) {
        // Check if the last segment has moved past the jump position
        const lastSegment = state.snake[state.snake.length - 1];

        // Determine if the last segment has passed the jump point based on direction
        if (
          state.direction === "RIGHT" &&
          lastSegment.x > state.jumpPosition.x
        ) {
          clearJumpPosition = true;
        } else if (
          state.direction === "LEFT" &&
          lastSegment.x < state.jumpPosition.x
        ) {
          clearJumpPosition = true;
        } else if (
          state.direction === "DOWN" &&
          lastSegment.y > state.jumpPosition.y
        ) {
          clearJumpPosition = true;
        } else if (
          state.direction === "UP" &&
          lastSegment.y < state.jumpPosition.y
        ) {
          clearJumpPosition = true;
        }
      }

      // Check if the snake hit a bullet drop
      let newBulletCount = state.bulletCount;
      let newBulletDrop = state.bulletDrop;

      if (
        !head.isJumping &&
        state.bulletDrop &&
        head.x === state.bulletDrop.x &&
        head.y === state.bulletDrop.y
      ) {
        newBulletCount += BULLETS_PER_DROP;
        newBulletDrop = null;
      }

      // Check if the snake hit food
      if (
        !head.isJumping &&
        head.x === state.food.x &&
        head.y === state.food.y
      ) {
        let newFoodEatenCount = state.foodEatenSinceLastDrop + 1;
        let shouldSpawnBulletDrop = false;

        // Check if we should spawn a bullet drop
        if (newFoodEatenCount >= FOOD_COUNT_FOR_DROP) {
          newFoodEatenCount = 0;
          shouldSpawnBulletDrop = true;
        }

        // Generate new bullet drop if needed
        let bulletDrop = state.bulletDrop;
        if (shouldSpawnBulletDrop && !bulletDrop) {
          // Find a position that doesn't overlap with snake or food
          let validPosition = false;
          let dropX = 0;
          let dropY = 0;

          while (!validPosition) {
            dropX = Math.floor(Math.random() * GRID_SIZE);
            dropY = Math.floor(Math.random() * GRID_SIZE);

            // Check if position overlaps with snake or new food
            const overlapsWithSnake = [head, ...state.snake].some(
              (segment) => segment.x === dropX && segment.y === dropY
            );

            // Generate new food position
            const newFoodX = Math.floor(Math.random() * GRID_SIZE);
            const newFoodY = Math.floor(Math.random() * GRID_SIZE);

            if (
              !overlapsWithSnake &&
              !(dropX === newFoodX && dropY === newFoodY)
            ) {
              validPosition = true;
              bulletDrop = { x: dropX, y: dropY };
            }
          }
        }

        return {
          ...state,
          snake: [...newSnake, state.snake[state.snake.length - 1]],
          food: {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          },
          score: state.score + 1,
          foodEatenSinceLastDrop: newFoodEatenCount,
          bulletDrop: bulletDrop || state.bulletDrop,
          bulletCount: newBulletCount,
          // Clear the jump position if the entire snake has passed
          jumpPosition: clearJumpPosition ? null : state.jumpPosition,
        };
      }

      return {
        ...state,
        snake: newSnake,
        bulletCount: newBulletCount,
        bulletDrop: newBulletDrop,
        // Clear the jump position if the entire snake has passed
        jumpPosition: clearJumpPosition ? null : state.jumpPosition,
      };
    }
    case "CHANGE_DIRECTION":
      return { ...state, direction: action.direction };
    case "JUMP":
      return {
        ...state,
        isJumping: true,
        // Save the position in front of the head as the jump position
        jumpPosition: {
          x:
            state.snake[0].x +
            (state.direction === "RIGHT"
              ? 1
              : state.direction === "LEFT"
              ? -1
              : 0),
          y:
            state.snake[0].y +
            (state.direction === "DOWN"
              ? 1
              : state.direction === "UP"
              ? -1
              : 0),
        },
      };
    case "LAND":
      return {
        ...state,
        isJumping: false,
        // Keep the jump position so all segments can jump
      };
    case "SHOOT": {
      // Only shoot if there are bullets available
      if (state.bulletCount <= 0) {
        return state;
      }

      // Create a new bullet with the current direction
      const bullet: Bullet = {
        x: state.snake[0].x,
        y: state.snake[0].y,
        direction: state.direction,
      };

      return {
        ...state,
        bullets: [...state.bullets, bullet],
        bulletCount: state.bulletCount - 1,
      };
    }
    case "UPDATE_BULLETS": {
      // Check for food hits and update score if needed
      let newScore = state.score;
      let newFood = state.food;
      let foodHit = false;
      let bulletsToKeep = [...state.bullets];
      let newFoodEatenCount = state.foodEatenSinceLastDrop;
      let newBulletDrop = state.bulletDrop;

      // Line-based collision detection
      const checkBulletFoodCollision = (
        start: Position,
        end: Position,
        food: Position
      ): boolean => {
        // For each cardinal direction, check if the bullet passes through the food
        if (start.x === end.x && start.x === food.x) {
          // Moving vertically in same column as food
          return (
            (start.y <= food.y && food.y <= end.y) ||
            (end.y <= food.y && food.y <= start.y)
          );
        }

        if (start.y === end.y && start.y === food.y) {
          // Moving horizontally in same row as food
          return (
            (start.x <= food.x && food.x <= end.x) ||
            (end.x <= food.x && food.x <= start.x)
          );
        }

        return false;
      };

      // Check if any bullet hit the food before moving them
      for (let i = 0; i < bulletsToKeep.length; i++) {
        const b = bulletsToKeep[i];
        // Exact position match (already on food)
        if (b.x === state.food.x && b.y === state.food.y) {
          foodHit = true;
          newScore = state.score + 1;
          newFoodEatenCount += 1;

          // Check if we need to spawn a bullet drop
          if (newFoodEatenCount >= FOOD_COUNT_FOR_DROP) {
            newFoodEatenCount = 0;

            // Find a position that doesn't overlap with snake or food
            let validPosition = false;
            let dropX = 0;
            let dropY = 0;

            while (!validPosition) {
              dropX = Math.floor(Math.random() * GRID_SIZE);
              dropY = Math.floor(Math.random() * GRID_SIZE);

              // New food position
              const newFoodX = Math.floor(Math.random() * GRID_SIZE);
              const newFoodY = Math.floor(Math.random() * GRID_SIZE);

              // Check if position overlaps with snake or new food
              const overlapsWithSnake = state.snake.some(
                (segment) => segment.x === dropX && segment.y === dropY
              );

              if (
                !overlapsWithSnake &&
                !(dropX === newFoodX && dropY === newFoodY)
              ) {
                validPosition = true;
                newBulletDrop = { x: dropX, y: dropY };
              }
            }
          }

          newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          };
          bulletsToKeep.splice(i, 1);
          i--;
        }
      }

      // Update positions of remaining bullets
      const newBullets = bulletsToKeep
        .map((b) => {
          // Calculate new position based on direction
          let newX = b.x;
          let newY = b.y;

          switch (b.direction) {
            case "UP":
              newY = b.y - 2;
              break;
            case "DOWN":
              newY = b.y + 2;
              break;
            case "LEFT":
              newX = b.x - 2;
              break;
            case "RIGHT":
              newX = b.x + 2;
              break;
          }

          // Check if bullet passes through food while moving
          if (
            !foodHit &&
            checkBulletFoodCollision(
              { x: b.x, y: b.y },
              { x: newX, y: newY },
              state.food
            )
          ) {
            foodHit = true;
            newScore = state.score + 1;
            newFoodEatenCount += 1;

            // Check if we need to spawn a bullet drop
            if (newFoodEatenCount >= FOOD_COUNT_FOR_DROP) {
              newFoodEatenCount = 0;

              // Find a position that doesn't overlap with snake or food
              let validPosition = false;
              let dropX = 0;
              let dropY = 0;

              while (!validPosition) {
                dropX = Math.floor(Math.random() * GRID_SIZE);
                dropY = Math.floor(Math.random() * GRID_SIZE);

                // New food position
                const newFoodX = Math.floor(Math.random() * GRID_SIZE);
                const newFoodY = Math.floor(Math.random() * GRID_SIZE);

                // Check if position overlaps with snake or new food
                const overlapsWithSnake = state.snake.some(
                  (segment) => segment.x === dropX && segment.y === dropY
                );

                if (
                  !overlapsWithSnake &&
                  !(dropX === newFoodX && dropY === newFoodY)
                ) {
                  validPosition = true;
                  newBulletDrop = { x: dropX, y: dropY };
                }
              }
            }

            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
            };
            return null;
          }

          return { ...b, x: newX, y: newY };
        })
        .filter(
          (b) =>
            b !== null &&
            b.x >= 0 &&
            b.x < GRID_SIZE &&
            b.y >= 0 &&
            b.y < GRID_SIZE
        ) as Bullet[];

      return {
        ...state,
        bullets: newBullets,
        food: foodHit ? newFood : state.food,
        score: foodHit ? newScore : state.score,
        foodEatenSinceLastDrop: foodHit
          ? newFoodEatenCount
          : state.foodEatenSinceLastDrop,
        bulletDrop: newBulletDrop,
      };
    }
    case "SET_STATUS":
      return { ...state, gameStatus: action.status };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [showInstructions, setShowInstructions] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bulletIntervalRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameBoardWrapperRef = useRef<HTMLDivElement>(null);

  // Add state to detect if on mobile device
  const [isMobile, setIsMobile] = useState(false);

  // Add state for dynamic cell size
  const [cellSize, setCellSize] = useState(BASE_CELL_SIZE);

  // Function to detect mobile device
  const detectMobile = useCallback(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;

    setIsMobile(isMobileDevice);
  }, []);

  // Function to calculate the appropriate cell size based on screen size
  const calculateCellSize = useCallback(() => {
    if (!gameBoardWrapperRef.current) return;

    // Get the available width
    const containerWidth = gameBoardWrapperRef.current.clientWidth;
    const containerHeight = window.innerHeight * 0.6;

    // Calculate the cell size that would fit the available space
    const maxWidthCellSize = Math.floor(containerWidth / GRID_SIZE);
    const maxHeightCellSize = Math.floor(containerHeight / GRID_SIZE);

    // Use the smaller dimension to ensure the game board fits completely
    const newCellSize = Math.min(
      maxWidthCellSize,
      maxHeightCellSize,
      BASE_CELL_SIZE
    );

    // Don't let cell size get too small
    const finalCellSize = Math.max(newCellSize, 10);

    setCellSize(finalCellSize);
  }, []);

  // Detect mobile device and recalculate cell size when window resizes
  useEffect(() => {
    detectMobile();
    calculateCellSize();

    window.addEventListener("resize", detectMobile);
    window.addEventListener("resize", calculateCellSize);

    return () => {
      window.removeEventListener("resize", detectMobile);
      window.removeEventListener("resize", calculateCellSize);
    };
  }, [detectMobile, calculateCellSize]);

  // Game loop for snake movement
  useEffect(() => {
    if (state.gameStatus !== "PLAYING") return;

    const interval = setInterval(() => {
      dispatch({ type: "MOVE" });
    }, SNAKE_SPEED);

    return () => clearInterval(interval);
  }, [state.gameStatus]);

  // Separate loop for bullets
  useEffect(() => {
    if (state.gameStatus !== "PLAYING") return;

    if (bulletIntervalRef.current) {
      clearInterval(bulletIntervalRef.current);
    }

    bulletIntervalRef.current = window.setInterval(() => {
      dispatch({ type: "UPDATE_BULLETS" });
    }, 100);

    return () => {
      if (bulletIntervalRef.current) {
        clearInterval(bulletIntervalRef.current);
      }
    };
  }, [state.gameStatus]);

  useEffect(() => {
    if (state.isJumping && gameContainerRef.current) {
      // Create a bounce effect for the game container
      gsap.to(gameContainerRef.current, {
        y: -0,
        duration: 0.1,
        ease: "power1.out",
        yoyo: true,
        repeat: 1,
      });
    }
  }, [state.isJumping]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();

      // Start the game with arrow keys if it's paused
      if (state.gameStatus !== "PLAYING" && state.gameStatus !== "GAME_OVER") {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          dispatch({ type: "SET_STATUS", status: "PLAYING" });
        }
      }

      switch (e.key) {
        case "ArrowUp":
          dispatch({ type: "CHANGE_DIRECTION", direction: "UP" });
          break;
        case "ArrowDown":
          dispatch({ type: "CHANGE_DIRECTION", direction: "DOWN" });
          break;
        case "ArrowLeft":
          dispatch({ type: "CHANGE_DIRECTION", direction: "LEFT" });
          break;
        case "ArrowRight":
          dispatch({ type: "CHANGE_DIRECTION", direction: "RIGHT" });
          break;
        case " ":
          dispatch({ type: "JUMP" });
          setTimeout(() => dispatch({ type: "LAND" }), JUMP_DURATION);
          break;
        case "f":
          dispatch({ type: "SHOOT" });
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.gameStatus]);

  // Check collision with proper jump check
  useEffect(() => {
    const head = state.snake[0];

    // Check for wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      dispatch({ type: "SET_STATUS", status: "GAME_OVER" });
      return;
    }

    // Check for self collision, but ignore if the segment is jumping
    if (!head.isJumping) {
      // Check if head collides with any other segment
      for (let i = 1; i < state.snake.length; i++) {
        const segment = state.snake[i];
        if (segment.x === head.x && segment.y === head.y) {
          dispatch({ type: "SET_STATUS", status: "GAME_OVER" });
          return;
        }
      }
    }
  }, [state.snake]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 w-full max-w-3xl">
        {/* Header Section with Score and Title */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-1">
              SNAKE+
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-4 md:space-x-6 mt-2">
              <div className="bg-black/30 backdrop-blur-sm px-3 py-1 md:px-4 md:py-2 rounded-lg">
                <span className="text-white text-xs md:text-sm">SCORE</span>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {state.score}
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm px-3 py-1 md:px-4 md:py-2 rounded-lg">
                <span className="text-white text-xs md:text-sm">BULLETS</span>
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {state.bulletCount}
                </div>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() =>
                dispatch({
                  type: "SET_STATUS",
                  status: state.gameStatus === "PLAYING" ? "PAUSED" : "PLAYING",
                })
              }
              className="px-3 py-1 md:px-5 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 md:h-5 md:w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {state.gameStatus === "PLAYING" ? (
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {state.gameStatus === "PLAYING"
                ? "Pause"
                : state.score === 0
                ? "Play"
                : "Resume"}
            </button>
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="px-3 py-1 md:px-5 md:py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm md:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 md:h-5 md:w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Restart
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="px-3 py-1 md:px-5 md:py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm md:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 md:h-5 md:w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Help
            </button>
          </div>
        </div>

        {/* Game Board*/}
        <div
          ref={gameBoardWrapperRef}
          className="flex justify-center items-center w-full mx-auto my-4"
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * cellSize}
            height={GRID_SIZE * cellSize}
            className="absolute z-0"
          />
          <div
            ref={gameContainerRef}
            className="relative z-10 bg-gray-900 rounded-lg overflow-hidden shadow-inner border border-gray-700"
            style={{
              width: GRID_SIZE * cellSize,
              height: GRID_SIZE * cellSize,
              perspective: "1000px",
            }}
          >
            {/* Render all snake segments */}
            {state.snake.map((segment, i) => {
              // Render the base/shadow for all segments
              return (
                <React.Fragment key={`segment-${i}`}>
                  {/* Base/shadow layer for all segments */}
                  <div
                    key={`base-${i}`}
                    className={`absolute rounded-full ${
                      segment.isJumping
                        ? "bg-black"
                        : "bg-gradient-to-r from-green-400 to-green-600"
                    }`}
                    style={{
                      left: segment.x * cellSize,
                      top: segment.y * cellSize,
                      width: cellSize,
                      height: cellSize,
                      zIndex: 10,
                    }}
                  />

                  {/* If the segment is jumping, render the smaller circle exactly centered */}
                  {segment.isJumping && (
                    <div
                      className="absolute rounded-full bg-gradient-to-r from-green-300 to-green-500"
                      style={{
                        position: "absolute",
                        left: segment.x * cellSize + cellSize / 2,
                        top: segment.y * cellSize + cellSize / 2,
                        width: cellSize * 0.6,
                        height: cellSize * 0.6,
                        transform: "translate(-50%, -50%)",
                        transition: "all 0.15s ease",
                        zIndex: 20,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
            <div
              className="absolute rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-lg shadow-red-500/30"
              style={{
                left: state.food.x * cellSize,
                top: state.food.y * cellSize,
                width: cellSize,
                height: cellSize,
              }}
            />
            {state.bulletDrop && (
              <div
                className="absolute rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 animate-pulse shadow-lg shadow-yellow-500/30"
                style={{
                  left: state.bulletDrop.x * cellSize,
                  top: state.bulletDrop.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              >
                <div className="flex items-center justify-center h-full text-xs font-bold">
                  +{BULLETS_PER_DROP}
                </div>
              </div>
            )}
            {state.bullets.map((bullet, i) => (
              <div
                key={`bullet-${i}`}
                className="absolute rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                style={{
                  left: bullet.x * cellSize + cellSize / 4,
                  top: bullet.y * cellSize + cellSize / 4,
                  width: cellSize / 2,
                  height: cellSize / 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Keyboard controls explanation for desktop users */}
        {!isMobile && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 md:p-4 mb-4 mx-auto max-w-lg">
            <p className="text-white text-sm md:text-base text-center">
              Use <span className="font-bold">arrow keys</span> to move,{" "}
              <span className="font-bold">space</span> to jump, and{" "}
              <span className="font-bold">F key</span> to shoot.
            </p>
          </div>
        )}

        {/* Mobile Game Control Buttons - Only shown on mobile devices */}
        {isMobile && (
          <div className="mt-4 md:mt-6 flex flex-col items-center justify-center">
            {/* Game controls using a directional pad layout */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 w-36 sm:w-48">
              {/* Top row */}
              <div className="col-start-1 col-end-1"></div>
              <button
                onClick={() =>
                  dispatch({ type: "CHANGE_DIRECTION", direction: "UP" })
                }
                className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                aria-label="Move Up"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
              <div className="col-start-3 col-end-3"></div>

              {/* Middle row */}
              <button
                onClick={() =>
                  dispatch({ type: "CHANGE_DIRECTION", direction: "LEFT" })
                }
                className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                aria-label="Move Left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Center button - a small visual indicator */}
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-700"></div>
              </div>

              <button
                onClick={() =>
                  dispatch({ type: "CHANGE_DIRECTION", direction: "RIGHT" })
                }
                className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                aria-label="Move Right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {/* Bottom row */}
              <div className="col-start-1 col-end-1"></div>
              <button
                onClick={() =>
                  dispatch({ type: "CHANGE_DIRECTION", direction: "DOWN" })
                }
                className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                aria-label="Move Down"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </button>
              <div className="col-start-3 col-end-3"></div>
            </div>

            {/* Action buttons side by side */}
            <div className="flex justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  if (!state.isJumping) {
                    dispatch({ type: "JUMP" });
                    setTimeout(() => dispatch({ type: "LAND" }), JUMP_DURATION);
                  }
                }}
                className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm sm:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-24 sm:w-32 ${
                  state.isJumping ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={state.isJumping}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Jump
              </button>

              <button
                onClick={() => dispatch({ type: "SHOOT" })}
                className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-24 sm:w-32 ${
                  state.bulletCount > 0
                    ? "bg-gradient-to-r from-orange-500 to-orange-700 text-white"
                    : "bg-gray-700 text-gray-300 cursor-not-allowed"
                }`}
                disabled={state.bulletCount <= 0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                Shoot
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                How to Play
              </h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2 md:space-y-3 text-gray-300 text-sm md:text-base">
              <div className="flex items-start">
                <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p>
                  Use <span className="text-white font-medium">arrow keys</span>{" "}
                  to move the snake
                </p>
              </div>

              <div className="flex items-start">
                <div className="bg-red-500/20 p-2 rounded-full mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p>
                  Eat <span className="text-red-400 font-medium">red food</span>{" "}
                  to grow and score
                </p>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-500/20 p-2 rounded-full mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-purple-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p>
                  Press <span className="text-white font-medium">Space</span> to
                  jump over your tail
                </p>
              </div>

              <div className="flex items-start">
                <div className="bg-orange-500/20 p-2 rounded-full mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-orange-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p>
                  Press <span className="text-white font-medium">F</span> to
                  shoot food for points
                </p>
              </div>

              <div className="flex items-start">
                <div className="bg-yellow-500/20 p-2 rounded-full mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                  </svg>
                </div>
                <p>
                  Yellow orbs give you{" "}
                  <span className="text-yellow-300 font-medium">
                    +{BULLETS_PER_DROP}
                  </span>{" "}
                  bullets
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="mt-4 md:mt-6 w-full px-4 py-2 md:py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm md:text-base font-medium rounded-lg shadow-lg hover:from-indigo-600 hover:to-indigo-800 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {state.gameStatus === "GAME_OVER" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full border border-gray-700 shadow-2xl text-center">
            <div className="mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 md:h-16 md:w-16 mx-auto text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-1">
              Game Over!
            </h2>
            <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">
              Better luck next time
            </p>

            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4 md:mb-6">
              <p className="text-gray-400 text-sm md:text-base">Final Score</p>
              <p className="text-3xl md:text-4xl font-bold text-white">
                {state.score}
              </p>
            </div>

            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm md:text-base font-medium rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 md:h-5 md:w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
