import React, { useState, useEffect, useCallback, memo } from "react";
import { format, parse, differenceInSeconds } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faRedo,
  faCheck,
  faCalculator,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

interface Project {
  id: string;
  name: string;
  payPerHour: number;
  startDate: string;
  totalSeconds: number;
  isRunning: boolean;
  lastStartTime?: number;
  isFinalized: boolean;
  showTimeCalculator: boolean;
  showManualTimeInput: boolean;
  lastAddedTime?: {
    seconds: number;
    message: string;
  };
}

const TimeInput = memo(
  ({
    value,
    onChange,
    disabled,
  }: {
    value: {
      hours: number | null;
      minutes: number | null;
      seconds: number | null;
    };
    onChange: (value: {
      hours: number | null;
      minutes: number | null;
      seconds: number | null;
    }) => void;
    disabled: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative mb-6">
        <input
          type="number"
          value={value.hours === null ? "" : value.hours}
          onChange={(e) => {
            const val = e.target.value === "" ? null : Number(e.target.value);
            onChange({ ...value, hours: val });
          }}
          placeholder="H"
          disabled={disabled}
          className="w-full sm:w-20 p-2 border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm text-center"
        />
        <span className="absolute text-xs text-violet-500 -bottom-5 left-0 right-0 text-center">
          Hours
        </span>
      </div>
      <div className="relative mb-6">
        <input
          type="number"
          value={value.minutes === null ? "" : value.minutes}
          onChange={(e) => {
            const val = e.target.value === "" ? null : Number(e.target.value);
            onChange({ ...value, minutes: val });
          }}
          placeholder="M"
          disabled={disabled}
          className="w-full sm:w-20 p-2 border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm text-center"
        />
        <span className="absolute text-xs text-violet-500 -bottom-5 left-0 right-0 text-center">
          Minutes
        </span>
      </div>
      <div className="relative mb-6">
        <input
          type="number"
          value={value.seconds === null ? "" : value.seconds}
          onChange={(e) => {
            const val = e.target.value === "" ? null : Number(e.target.value);
            onChange({ ...value, seconds: val });
          }}
          placeholder="S"
          disabled={disabled}
          className="w-full sm:w-20 p-2 border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm text-center"
        />
        <span className="absolute text-xs text-violet-500 -bottom-5 left-0 right-0 text-center">
          Seconds
        </span>
      </div>
    </div>
  )
);

// Time calculator component
const TimeCalculator = memo(
  ({
    onAddTime,
    onClose,
  }: {
    onAddTime: (seconds: number) => void;
    onClose: () => void;
  }) => {
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("17:00");
    const [calculatedSeconds, setCalculatedSeconds] = useState<number>(0);

    const calculateTime = () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const start = parse(
        `${today} ${startTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      const end = parse(`${today} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());

      // Handle next day if end time is before start time
      let diff = differenceInSeconds(end, start);
      if (diff < 0) {
        // Add 24 hours in seconds
        diff += 24 * 60 * 60;
      }

      setCalculatedSeconds(diff);
    };

    useEffect(() => {
      calculateTime();
    }, [startTime, endTime]);

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleAddTime = () => {
      onAddTime(calculatedSeconds);
    };

    return (
      <>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-indigo-700">
            Time Calculator
          </h4>
          <button
            onClick={onClose}
            className="p-1 bg-white text-indigo-500 hover:text-indigo-700 rounded-full shadow-sm"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
            <p className="text-sm text-indigo-600 font-medium mb-2">
              Start Time
            </p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
            <p className="text-sm text-indigo-600 font-medium mb-2">End Time</p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 bg-white p-6 rounded-lg shadow-sm border border-indigo-100 overflow-hidden">
          <div className="mb-4 sm:mb-0 w-full sm:w-auto">
            <p className="text-sm text-indigo-600 font-medium">
              Calculated Time:
            </p>
            <p className="font-bold text-lg text-indigo-800 break-words">
              {formatTime(calculatedSeconds)}
            </p>
          </div>
          <button
            onClick={handleAddTime}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 shadow-md transform hover:scale-105 transition duration-200"
          >
            Add to Project
          </button>
        </div>
      </>
    );
  }
);

const ProjectCard = memo(
  ({
    project,
    onToggle,
    onReset,
    onFinalize,
    onManualUpdate,
    onToggleCalculator,
    onToggleManualInput,
    onClearLastAdded,
  }: {
    project: Project;
    onToggle: (id: string) => void;
    onReset: (id: string) => void;
    onFinalize: (id: string) => void;
    onManualUpdate: (
      id: string,
      time: {
        hours: number | null;
        minutes: number | null;
        seconds: number | null;
      }
    ) => void;
    onToggleCalculator: (id: string) => void;
    onToggleManualInput: (id: string) => void;
    onClearLastAdded: (id: string) => void;
  }) => {
    const [manualTime, setManualTime] = useState({
      hours: null as number | null,
      minutes: null as number | null,
      seconds: null as number | null,
    });

    const formatTime = (seconds: number) => {
      seconds = Math.floor(seconds);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const totalPay =
      (Math.floor(project.totalSeconds) / 3600) * project.payPerHour;

    return (
      <div
        className={`bg-white p-5 rounded-xl shadow-lg mb-4 border-l-4 ${
          project.isFinalized
            ? "border-gray-400"
            : project.isRunning
            ? "border-pink-500"
            : "border-indigo-500"
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h3
            className={`text-xl font-semibold ${
              project.isFinalized ? "text-gray-600" : "text-indigo-700"
            }`}
          >
            {project.name}
            {project.isFinalized && (
              <span className="ml-2 text-xs font-normal bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                Finalized
              </span>
            )}
            {project.isRunning && (
              <span className="ml-2 text-xs font-normal bg-pink-100 text-pink-700 px-2 py-1 rounded-full animate-pulse">
                Running
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {!project.isFinalized && (
              <>
                <button
                  onClick={() => onToggle(project.id)}
                  className={`p-2 rounded-lg ${
                    project.isRunning
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  } text-white shadow-md transform hover:scale-105 transition duration-200`}
                >
                  <FontAwesomeIcon
                    icon={project.isRunning ? faPause : faPlay}
                  />
                </button>
                <button
                  onClick={() => onReset(project.id)}
                  className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-md transform hover:scale-105 transition duration-200 hover:from-amber-600 hover:to-orange-600"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
                <button
                  onClick={() => onFinalize(project.id)}
                  className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-md transform hover:scale-105 transition duration-200 hover:from-indigo-600 hover:to-purple-600"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-3">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <p className="text-sm text-indigo-600 font-medium">Total Time</p>
            <p className="font-bold text-lg text-indigo-800">
              {formatTime(project.totalSeconds)}
            </p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg">
            <p className="text-sm text-emerald-600 font-medium">Total Pay</p>
            <p className="font-bold text-lg text-emerald-800">
              ${totalPay.toFixed(2)}
            </p>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Pay Rate</p>
            <p className="font-bold text-lg text-amber-800">
              ${project.payPerHour}/hr
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Start Date</p>
            <p className="font-bold text-lg text-purple-800">
              {project.startDate}
            </p>
          </div>
        </div>

        {/* Last added time notification */}
        {project.lastAddedTime && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg mt-3 mb-3 shadow-md animate-fadeIn">
            <div className="flex justify-between items-center">
              <p className="text-emerald-700 font-medium">
                {project.lastAddedTime.message}
              </p>
              <button
                onClick={() => onClearLastAdded(project.id)}
                className="text-emerald-500 hover:text-emerald-700 bg-white p-1 rounded-full shadow-sm"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        )}

        {/* Time calculator */}
        {project.showTimeCalculator && !project.isFinalized && (
          <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-200 shadow-md">
            <TimeCalculator
              onAddTime={(seconds) => {
                const time = {
                  hours: Math.floor(seconds / 3600),
                  minutes: Math.floor((seconds % 3600) / 60),
                  seconds: seconds % 60,
                };
                onManualUpdate(project.id, time);
              }}
              onClose={() => onToggleCalculator(project.id)}
            />
          </div>
        )}

        {/* Time entry buttons when neither calculator nor manual input is shown */}
        {!project.isFinalized &&
          !project.showTimeCalculator &&
          !project.showManualTimeInput &&
          !project.lastAddedTime && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onToggleManualInput(project.id)}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:from-violet-600 hover:to-purple-600 shadow-md transform hover:scale-105 transition duration-200 flex items-center gap-1 justify-center"
              >
                <span>Manual Time Entry</span>
              </button>

              <button
                onClick={() => onToggleCalculator(project.id)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 shadow-md transform hover:scale-105 transition duration-200 flex items-center gap-1 justify-center"
              >
                <FontAwesomeIcon icon={faCalculator} className="mr-1" />
                <span>Time Calculator</span>
              </button>
            </div>
          )}

        {/* Manual time input */}
        {!project.isFinalized && project.showManualTimeInput && (
          <div className="mt-4 bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-lg border border-violet-200 shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-violet-700">
                Manual Time Entry
              </h4>
              <button
                onClick={() => onToggleManualInput(project.id)}
                className="p-1 bg-white text-violet-500 hover:text-violet-700 rounded-full shadow-sm"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex flex-col gap-3 items-start">
              <TimeInput
                value={manualTime}
                onChange={setManualTime}
                disabled={project.isRunning}
              />
              <button
                onClick={() => {
                  // Check if at least one value is provided
                  if (
                    manualTime.hours === null &&
                    manualTime.minutes === null &&
                    manualTime.seconds === null
                  ) {
                    return;
                  }

                  const hours = manualTime.hours ?? 0;
                  const minutes = manualTime.minutes ?? 0;
                  const seconds = manualTime.seconds ?? 0;

                  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

                  onManualUpdate(project.id, {
                    hours: hours,
                    minutes: minutes,
                    seconds: seconds,
                  });

                  setManualTime({ hours: null, minutes: null, seconds: null });
                }}
                disabled={project.isRunning}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition duration-200"
              >
                Add Time
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    name: "",
    payPerHour: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    let lastUpdateTime = 0;
    let animationFrameId: number;

    const updateTimer = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= 1000) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.isRunning && !p.isFinalized) {
              const now = Date.now();
              const elapsed = p.lastStartTime ? 1 : 0;
              return {
                ...p,
                totalSeconds: Math.floor(p.totalSeconds + elapsed),
                lastStartTime: now,
              };
            }
            return p;
          })
        );
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleToggle = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id && !p.isFinalized) {
          return {
            ...p,
            isRunning: !p.isRunning,
            lastStartTime: !p.isRunning ? Date.now() : undefined,
            // Clear UI states when toggling timer
            showTimeCalculator: false,
            showManualTimeInput: false,
            lastAddedTime: undefined,
          };
        }
        return p;
      })
    );
  }, []);

  const handleReset = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id && !p.isFinalized
          ? {
              ...p,
              totalSeconds: 0,
              isRunning: false,
              lastStartTime: undefined,
              lastAddedTime: undefined,
            }
          : p
      )
    );
  }, []);

  const handleFinalize = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isFinalized: true,
              isRunning: false,
              lastStartTime: undefined,
              showTimeCalculator: false,
              showManualTimeInput: false,
              lastAddedTime: undefined,
            }
          : p
      )
    );
  }, []);

  const handleManualUpdate = useCallback(
    (
      id: string,
      time: {
        hours: number | null;
        minutes: number | null;
        seconds: number | null;
      }
    ) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === id && !p.isFinalized) {
            const hours = time.hours ?? 0;
            const minutes = time.minutes ?? 0;
            const seconds = time.seconds ?? 0;

            const additionalSeconds = hours * 3600 + minutes * 60 + seconds;

            // Message for the time added notification
            const formatTimeStr = () => {
              const parts = [];
              if (hours > 0)
                parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
              if (minutes > 0)
                parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
              if (seconds > 0)
                parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
              return parts.join(", ");
            };

            const timeMessage = formatTimeStr();
            const message = `Added ${timeMessage} to the project`;

            return {
              ...p,
              totalSeconds: p.totalSeconds + additionalSeconds,
              showTimeCalculator: false,
              showManualTimeInput: false,
              lastAddedTime: {
                seconds: additionalSeconds,
                message: message,
              },
            };
          }
          return p;
        })
      );
    },
    []
  );

  const handleToggleCalculator = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id && !p.isFinalized) {
          return {
            ...p,
            showTimeCalculator: !p.showTimeCalculator,
            showManualTimeInput: false,
            lastAddedTime: undefined,
          };
        }
        return p;
      })
    );
  }, []);

  const handleToggleManualInput = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id && !p.isFinalized) {
          return {
            ...p,
            showManualTimeInput: !p.showManualTimeInput,
            showTimeCalculator: false,
            lastAddedTime: undefined,
          };
        }
        return p;
      })
    );
  }, []);

  const handleClearLastAdded = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            lastAddedTime: undefined,
          };
        }
        return p;
      })
    );
  }, []);

  const handleAddProject = () => {
    if (!newProject.name || !newProject.payPerHour) return;
    setProjects([
      {
        id: Date.now().toString(),
        name: newProject.name,
        payPerHour: Number(newProject.payPerHour),
        startDate: newProject.startDate,
        totalSeconds: 0,
        isRunning: false,
        isFinalized: false,
        showTimeCalculator: false,
        showManualTimeInput: false,
        lastAddedTime: undefined,
      },
      ...projects,
    ]);
    setNewProject({
      name: "",
      payPerHour: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen w-full">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-indigo-800 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Freelance Time Tracker
          </span>
        </h1>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border-t-4 border-indigo-500">
          <h2 className="text-xl font-semibold mb-5 text-indigo-700">
            Add New Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <input
              type="text"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              placeholder="Project Name"
              className="p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <input
              type="number"
              value={newProject.payPerHour}
              onChange={(e) =>
                setNewProject({ ...newProject, payPerHour: e.target.value })
              }
              placeholder="Pay per Hour ($)"
              className="p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <input
              type="date"
              value={newProject.startDate}
              onChange={(e) =>
                setNewProject({ ...newProject, startDate: e.target.value })
              }
              className="p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={handleAddProject}
            className="mt-5 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition duration-200 shadow-md font-medium"
          >
            Add Project
          </button>
        </div>

        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onToggle={handleToggle}
              onReset={handleReset}
              onFinalize={handleFinalize}
              onManualUpdate={handleManualUpdate}
              onToggleCalculator={handleToggleCalculator}
              onToggleManualInput={handleToggleManualInput}
              onClearLastAdded={handleClearLastAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
