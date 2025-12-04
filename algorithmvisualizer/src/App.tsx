import React, { useState, useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";

interface Node {
  id: number;
  label: string;
  distance?: number;
  color?: string;
  font?: {
    color: string;
    size: number;
    face: string;
    align: string;
  };
}

interface Edge {
  from: number;
  to: number;
  label: string;
  weight: number;
  color?: string;
  width?: number;
}

interface AlgorithmStep {
  distances: number[];
  current: number;
  processed?: number[];
  edge?: { from: number; to: number };
  description: string;
  isComplete?: boolean;
  paths?: number[][]; // Store the paths to each node
}

const numberToLetter = (num: number): string => {
  return String.fromCharCode(64 + num);
};

const App: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<"dijkstra" | "bellmanFord">(
    "dijkstra"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<AlgorithmStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);

  // Graph
  const nodes: Node[] = [
    { id: 1, label: "A" },
    { id: 2, label: "B" },
    { id: 3, label: "C" },
    { id: 4, label: "D" },
    { id: 5, label: "E" },
    { id: 6, label: "F" },
  ];

  const edges: Edge[] = [
    { from: 1, to: 2, weight: 4, label: "4" },
    { from: 1, to: 3, weight: 2, label: "2" },
    { from: 2, to: 3, weight: 1, label: "1" },
    { from: 2, to: 4, weight: 5, label: "5" },
    { from: 3, to: 4, weight: 8, label: "8" },
    { from: 3, to: 5, weight: 10, label: "10" },
    { from: 4, to: 5, weight: 2, label: "2" },
    { from: 5, to: 6, weight: 3, label: "3" },
    { from: 3, to: 6, weight: 6, label: "6" },
  ];

  // Initialize network
  useEffect(() => {
    if (networkRef.current) {
      networkInstance.current = new Network(networkRef.current, {
        nodes,
        edges,
        options: {
          nodes: {
            shape: "circle",
            size: 30,
            font: {
              color: "#ffffff", // White text
              size: 16,
              face: "arial",
              align: "center",
            },
            color: {
              background: "#3b82f6",
              border: "#1e40af",
              highlight: {
                background: "#60a5fa",
                border: "#1e40af",
              },
            },
          },
          edges: {
            arrows: {
              to: false,
            },
            font: {
              color: "white",
              size: 14,
              align: "middle",
              weight: "lighter",
              strokewidth: 0,
              face: "Helvetica Neue Light",
              bold: false,
            },
            color: {
              color: "#94a3b8",
              highlight: "#f59e0b",
            },
            smooth: {
              type: "curvedCW",
              roundness: 0.2,
            },
          },
          physics: { enabled: false },
          layout: {
            improvedLayout: true,
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
          },
          tooltip: {
            delay: 200,
            fontColor: "white",
            fontSize: 14,
            color: {
              background: "#1e293b", // Dark blue background
              border: "#3b82f6", // Blue border
            },
          },
        },
      });

      // Add responsive behavior
      const handleResize = () => {
        if (networkRef.current) {
          const height = window.innerHeight < 768 ? 300 : 500;
          networkRef.current.style.height = `${height}px`;
          networkInstance.current?.fit();
        }
      };

      // Initial sizing
      handleResize();

      // Event listener for window resize
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        networkInstance.current?.destroy();
      };
    }
  }, []);

  // Helper function to get current paths based on distances and previous array
  const getCurrentPaths = (distances: number[], previous: number[]) => {
    const paths = Array(distances.length).fill([]);
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] === Infinity) {
        paths[i] = [];
      } else if (i === 1) {
        paths[i] = [1];
      } else {
        const path = [];
        let node = i;
        while (node !== -1) {
          path.unshift(node);
          node = previous[node];
        }
        paths[i] = path;
      }
    }
    return paths;
  };

  // Algorithm implementations
  const runDijkstra = () => {
    const distances = Array(nodes.length + 1).fill(Infinity);
    distances[1] = 0;
    const visited = new Set<number>();
    const steps: AlgorithmStep[] = [];
    const previous = Array(nodes.length + 1).fill(-1); // To reconstruct paths

    // Initialize step
    steps.push({
      distances: [...distances],
      current: 1, // Start node
      processed: [],
      paths: [[]].concat(Array(nodes.length).fill([])), // Initially empty paths
      description: `Initialize distances: 0 for start node ${numberToLetter(
        1
      )}, ∞ for others.`,
    });

    while (visited.size < nodes.length) {
      let minDist = Infinity;
      let current = -1;

      // Find unvisited node with minimum distance
      for (let i = 1; i <= nodes.length; i++) {
        if (!visited.has(i) && distances[i] < minDist) {
          minDist = distances[i];
          current = i;
        }
      }

      if (current === -1) break;

      // Construct current paths for all nodes
      const currentPaths = getCurrentPaths(distances, previous);

      // Step for selecting current node
      steps.push({
        distances: [...distances],
        current,
        processed: Array.from(visited),
        paths: [...currentPaths],
        description: `Select node ${numberToLetter(
          current
        )} with smallest distance (${distances[current]}).`,
      });

      visited.add(current);

      // Update distances
      const currentEdges = edges.filter((e) => e.from === current);

      for (const edge of currentEdges) {
        const newDist = distances[current] + edge.weight;
        const oldDist = distances[edge.to];

        if (newDist < oldDist) {
          distances[edge.to] = newDist;
          previous[edge.to] = current; // Update previous node

          // Construct updated paths
          const updatedPaths = getCurrentPaths(distances, previous);

          steps.push({
            distances: [...distances],
            current,
            edge: { from: edge.from, to: edge.to },
            processed: Array.from(visited),
            paths: updatedPaths,
            description: `Update distance to node ${numberToLetter(edge.to)}: ${
              oldDist === Infinity ? "∞" : oldDist
            } → ${newDist} via node ${numberToLetter(current)}.`,
          });
        }
      }
    }

    // Completion step
    steps.push({
      distances: [...distances],
      current: -1,
      processed: Array.from(visited),
      paths: getCurrentPaths(distances, previous),
      description: "Algorithm complete. All nodes processed.",
      isComplete: true,
    });

    return steps;
  };

  const runBellmanFord = () => {
    const distances = Array(nodes.length + 1).fill(Infinity);
    distances[1] = 0;
    const steps: AlgorithmStep[] = [];
    const previous = Array(nodes.length + 1).fill(-1); // To reconstruct paths

    // Initialize step
    steps.push({
      distances: [...distances],
      current: 1,
      processed: [],
      paths: [[]].concat(Array(nodes.length).fill([])),
      description: `Initialize distances: 0 for start node ${numberToLetter(
        1
      )}, ∞ for others.`,
    });

    // Main Bellman-Ford iteration
    for (let i = 0; i < nodes.length - 1; i++) {
      let anyChange = false;

      // Iteration start step
      steps.push({
        distances: [...distances],
        current: -1,
        processed: [],
        paths: getCurrentPaths(distances, previous),
        description: `Starting iteration ${i + 1} of ${nodes.length - 1}.`,
      });

      // Relax all edges
      for (const edge of edges) {
        // Skip edges from unreachable nodes
        if (distances[edge.from] === Infinity) continue;

        const oldDist = distances[edge.to];
        const newDist = distances[edge.from] + edge.weight;

        // Check if we can relax this edge
        if (newDist < oldDist) {
          distances[edge.to] = newDist;
          previous[edge.to] = edge.from; // Update previous node
          anyChange = true;

          // Add relaxation step
          steps.push({
            distances: [...distances],
            current: edge.from,
            edge: { from: edge.from, to: edge.to },
            paths: getCurrentPaths(distances, previous),
            description: `Relax edge ${numberToLetter(
              edge.from
            )} → ${numberToLetter(
              edge.to
            )}: Update distance to node ${numberToLetter(edge.to)}: ${
              oldDist === Infinity ? "∞" : oldDist
            } → ${newDist}.`,
          });
        } else {
          // Add non-relaxation step
          steps.push({
            distances: [...distances],
            current: edge.from,
            edge: { from: edge.from, to: edge.to },
            paths: getCurrentPaths(distances, previous),
            description: `Edge ${numberToLetter(edge.from)} → ${numberToLetter(
              edge.to
            )}: No improvement (current: ${
              oldDist === Infinity ? "∞" : oldDist
            }, new: ${newDist}).`,
          });
        }
      }

      // If no changes in this iteration, stop early
      if (!anyChange) {
        steps.push({
          distances: [...distances],
          current: -1,
          paths: getCurrentPaths(distances, previous),
          description: `No improvements in iteration ${
            i + 1
          }. Early termination.`,
        });
        break;
      }
    }

    // Check for negative cycles
    let hasNegativeCycle = false;
    for (const edge of edges) {
      if (
        distances[edge.from] !== Infinity &&
        distances[edge.from] + edge.weight < distances[edge.to]
      ) {
        hasNegativeCycle = true;

        steps.push({
          distances: [...distances],
          current: -1,
          edge: { from: edge.from, to: edge.to },
          paths: getCurrentPaths(distances, previous),
          description: `Negative cycle detected involving edge ${numberToLetter(
            edge.from
          )} → ${numberToLetter(edge.to)}.`,
        });

        break;
      }
    }

    // Add completion step
    steps.push({
      distances: [...distances],
      current: -1,
      paths: getCurrentPaths(distances, previous),
      description: hasNegativeCycle
        ? "Algorithm complete. A negative cycle was detected."
        : "Algorithm complete. Final shortest paths found.",
      isComplete: true,
    });

    return steps;
  };

  // Restart the algorithm
  const restartAlgorithm = () => {
    setHistory([]);
    setStep(0);
    setIsComplete(false);
    setIsPlaying(false);
  };

  // Change algorithm
  const changeAlgorithm = (newAlgorithm: "dijkstra" | "bellmanFord") => {
    setAlgorithm(newAlgorithm);
    restartAlgorithm();
  };

  // Update visualization based on current step
  useEffect(() => {
    if (history.length === 0) {
      const newHistory =
        algorithm === "dijkstra" ? runDijkstra() : runBellmanFord();
      setHistory(newHistory);
      setStep(0);
      return;
    }

    if (step >= history.length) {
      setIsPlaying(false);
      setIsComplete(true);
      return;
    }

    const currentStep = history[step];

    // Check if this is the final step
    if (currentStep.isComplete) {
      setIsComplete(true);
      setIsPlaying(false);
    }

    // Update nodes with distances
    const updatedNodes = nodes.map((node) => {
      const distance = currentStep.distances[node.id];
      const isCurrentNode = node.id === currentStep.current;
      const isProcessed = currentStep.processed?.includes(node.id);

      // Choose color based on node status
      let nodeColor = "#3b82f6"; // Default blue
      if (isCurrentNode) nodeColor = "#22c55e"; // Green for current
      else if (node.id === 1) nodeColor = "#8b5cf6"; // Purple for source
      else if (isProcessed) nodeColor = "#6b7280"; // Gray for processed

      return {
        ...node,
        color: nodeColor,
        label: node.label,
        title: `Distance: ${distance === Infinity ? "∞" : distance}`,
        font: {
          color: "#ffffff",
          size: 16,
          face: "arial",
          align: "center",
        },
      };
    });

    // Update edges with highlighting for current edge
    const updatedEdges = edges.map((edge) => {
      const isCurrentEdge =
        currentStep.edge &&
        edge.from === currentStep.edge.from &&
        edge.to === currentStep.edge.to;

      return {
        ...edge,
        color: isCurrentEdge ? "#f59e0b" : "#94a3b8", // Highlight current edge
        width: isCurrentEdge ? 3 : 1,
      };
    });

    try {
      if (networkInstance.current) {
        networkInstance.current.setData({
          nodes: updatedNodes,
          edges: updatedEdges,
        });
      }
    } catch (error) {
      console.error("Error updating network data:", error);
    }

    if (currentStep.current > 0) {
      // Highlight the current node
      networkInstance.current?.selectNodes([currentStep.current], false);

      // Clear selection after a short delay
      setTimeout(() => {
        networkInstance.current?.unselectAll();
      }, 300);
    }
  }, [step, history, algorithm]);

  // Animation controls
  useEffect(() => {
    let interval: number;

    if (isPlaying && step < history.length - 1) {
      interval = window.setInterval(() => setStep((s) => s + 1), 1500);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isPlaying, step, history]);

  // Component for algorithm information
  const AlgorithmInfo = () => (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        {algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"} Algorithm
      </h2>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Steps:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          {algorithm === "dijkstra" ? (
            <>
              <li>
                Initialize distances from start node (0 for start, ∞ for others)
              </li>
              <li>Pick unvisited node with minimum distance</li>
              <li>Update distances to neighbors through current node</li>
              <li>Mark current node as visited</li>
              <li>Repeat until all nodes are visited</li>
            </>
          ) : (
            <>
              <li>
                Initialize distances from start node (0 for start, ∞ for others)
              </li>
              <li>
                Relax all edges |V|-1 times (where |V| is the number of
                vertices)
              </li>
              <li>
                For each edge, update distances if a shorter path is found
              </li>
              <li>
                Check for negative cycles (if there's still improvement after
                |V|-1 iterations)
              </li>
            </>
          )}
        </ol>
      </div>

      <div>
        <h3 className="font-medium mb-2">Key Details:</h3>
        <ul className="list-disc pl-5 space-y-2">
          {algorithm === "dijkstra" ? (
            <>
              <li>Greedy algorithm for shortest paths</li>
              <li>Doesn't work with negative weights</li>
              <li>Time complexity: O((V + E) log V)</li>
            </>
          ) : (
            <>
              <li>Handles negative weights correctly</li>
              <li>Can detect negative cycles</li>
              <li>Time complexity: O(VE)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );

  // Get description for current step
  const getCurrentStepDescription = () => {
    if (history.length === 0 || step >= history.length) return "";
    return history[step].description;
  };

  // Get current distance and path information for display
  const getCurrentDistances = () => {
    if (history.length === 0 || step >= history.length) return [];

    return nodes.map((node) => {
      const distance = history[step].distances[node.id];
      const path = history[step].paths?.[node.id] || [];

      // Format the path as letters (A→B→C)
      const pathString =
        path.length > 0
          ? path.map((nodeId) => numberToLetter(nodeId)).join("→")
          : "No path";

      return {
        node: node.label,
        distance: distance === Infinity ? "∞" : distance,
        path: pathString,
      };
    });
  };

  // Instructions for users component
  const HowToUse = () => (
    <div className="bg-gray-800 p-3 rounded-lg text-sm">
      <h2 className="text-base font-semibold mb-1">How to use:</h2>
      <p className="mb-1">
        This visualizer shows how{" "}
        {algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"} algorithm
        finds shortest paths from node A.
      </p>
      <ul className="list-disc pl-4 space-y-0.5">
        <li>Use Play/Pause to automate steps</li>
        <li>Use Previous/Next to step manually</li>
        <li>
          <span className="text-purple-400">Purple</span> = Source,
          <span className="text-green-400"> Green</span> = Current,
          <span className="text-gray-400"> Gray</span> = Processed
        </li>
        <li>Hover nodes to see distances</li>
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          Graph Algorithm Visualizer
        </h1>

        {/* Algorithm selection buttons*/}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            {/* Control buttons*/}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className={`px-4 py-2 rounded ${
                  step === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Previous
              </button>

              {/* Conditionally show Play/Pause or Restart based on completion status */}
              {isComplete && step === history.length - 1 ? (
                <button
                  onClick={restartAlgorithm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded"
                >
                  Restart
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
              )}

              <button
                onClick={() =>
                  setStep((s) => Math.min(history.length - 1, s + 1))
                }
                disabled={step === history.length - 1}
                className={`px-4 py-2 rounded ${
                  step === history.length - 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Next
              </button>
            </div>

            {/* Algorithm selection buttons*/}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => changeAlgorithm("dijkstra")}
                className={`px-4 py-2 rounded ${
                  algorithm === "dijkstra" ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                Dijkstra's
              </button>
              <button
                onClick={() => changeAlgorithm("bellmanFord")}
                className={`px-4 py-2 rounded ${
                  algorithm === "bellmanFord" ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                Bellman-Ford
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column with Current Step and Current Distances & Paths */}
          <div className="lg:col-span-1 order-2 lg:order-1 flex flex-col gap-4">
            {/* Step information panel*/}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Current Step</h3>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                  {history.length > 0
                    ? `Step ${step + 1} of ${history.length}`
                    : "Initializing..."}
                </span>
              </div>
              <p className="text-sm border-l-2 border-blue-500 pl-3">
                {getCurrentStepDescription()}
              </p>
            </div>

            {/* Current distances and paths display*/}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-center text-sm">
                Current Distances & Paths
              </h3>
              <div className="flex flex-col gap-2">
                {getCurrentDistances().map((item) => (
                  <div
                    key={item.node}
                    className="bg-gray-700 px-3 py-1.5 rounded-lg text-sm"
                  >
                    <span className="font-medium">{item.node}:</span>{" "}
                    {item.distance}
                    <div className="text-xs text-gray-300 mt-0.5">
                      Path: {item.path}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graph visualization area - center */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div
              id="network"
              ref={networkRef}
              className="bg-gray-900 rounded-lg"
              style={{ height: "500px" }}
            />

            {/* How to use box */}
            <div className="mt-4">
              <HowToUse />
            </div>
          </div>

          {/* Algorithm information panel - right */}
          <div className="lg:col-span-1 order-3">
            <AlgorithmInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
