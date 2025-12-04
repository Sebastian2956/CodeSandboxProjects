import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Bot,
  Check,
  X,
  Send,
  MessageCircle,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  color: string;
}

interface BusySlot {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface AIMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIQuery {
  date: string;
  startTime: string;
  endTime: string;
  result?: "available" | "busy" | "partial";
  conflicts?: string[];
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Alex", color: "#FF6B6B" },
    { id: "2", name: "Sam", color: "#4ECDC4" },
    { id: "3", name: "Jordan", color: "#45B7D1" },
  ]);

  const [currentUser, setCurrentUser] = useState<string>("1");
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
  });
  const [aiQuery, setAiQuery] = useState<AIQuery>({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
  });
  const [aiResult, setAiResult] = useState<AIQuery | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: "1",
      text: "Hi! I'm your scheduling assistant. Ask me questions like 'Is everyone free tomorrow at 2 PM?' or 'When is the best time for a meeting this week?'",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];

  const addUser = () => {
    if (newUserName.trim()) {
      const newUser: User = {
        id: Date.now().toString(),
        name: newUserName.trim(),
        color: colors[users.length % colors.length],
      };
      setUsers([...users, newUser]);
      setNewUserName("");
    }
  };

  const removeUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    setBusySlots(busySlots.filter((slot) => slot.userId !== userId));
    if (currentUser === userId) {
      setCurrentUser(users[0]?.id || "");
    }
  };

  const addBusySlot = () => {
    const newSlot: BusySlot = {
      id: Date.now().toString(),
      userId: currentUser,
      date: selectedDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      title: newEvent.title || "Busy",
    };
    setBusySlots([...busySlots, newSlot]);
    setNewEvent({ title: "", startTime: "09:00", endTime: "10:00" });
    setShowAddEvent(false);
  };

  const removeBusySlot = (slotId: string) => {
    setBusySlots(busySlots.filter((slot) => slot.id !== slotId));
  };

  const processAIMessage = (message: string) => {
    // Add user message
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");

    // Simulate AI processing
    setTimeout(() => {
      let aiResponse = generateAIResponse(message);
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    }, 1000 + Math.random() * 1500);
  };

  const generateAIResponse = (message: string) => {
    const lowerMsg = message.toLowerCase();

    // Parse common time patterns
    const timePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|)/i;
    const datePattern =
      /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week)/i;

    // Check for availability queries
    if (
      lowerMsg.includes("available") ||
      lowerMsg.includes("free") ||
      lowerMsg.includes("busy")
    ) {
      const timeMatch = message.match(timePattern);
      const dateMatch = message.match(datePattern);

      if (timeMatch || dateMatch) {
        // Mock availability check
        const conflictCount = Math.floor(Math.random() * users.length);
        const conflictUsers = users.slice(0, conflictCount).map((u) => u.name);

        if (conflictCount === 0) {
          return `✅ Great news! Everyone appears to be available at that time. Perfect for scheduling a meeting!`;
        } else if (conflictCount === users.length) {
          return `❌ Unfortunately, everyone seems to be busy at that time. Try asking about alternative times?`;
        } else {
          return `⚠️ Partially available - ${conflictUsers.join(", ")} ${
            conflictCount === 1 ? "has" : "have"
          } conflicts at that time. The others are free!`;
        }
      }
    }

    // Meeting suggestions
    if (lowerMsg.includes("meeting") || lowerMsg.includes("best time")) {
      const suggestions = [
        "Based on the current schedules, I'd suggest 10:00 AM or 2:30 PM - those slots look clear for most people!",
        "Looking at patterns, mornings around 9:30 AM tend to work well for your team.",
        "I notice fewer conflicts in the early afternoon - how about 1:00 PM?",
        "Wednesday looks particularly open for your team. Want me to check specific times?",
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    // General help
    if (lowerMsg.includes("help") || lowerMsg.includes("what can")) {
      return "I can help you:\n• Check availability for specific times\n• Suggest optimal meeting times\n• Analyze schedule patterns\n• Find conflicts and alternatives\n\nJust ask in natural language like 'Is everyone free Friday at 3 PM?'";
    }

    // Default responses
    const responses = [
      "I can help you check availability and find the best meeting times. What specific time were you thinking?",
      "Let me analyze the schedules... Could you specify a date and time you're considering?",
      "I'd be happy to help with scheduling! What day and time did you have in mind?",
      "To give you the most accurate availability, please mention a specific date and time in your question.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const getSlotsForTime = (time: string) => {
    return busySlots.filter(
      (slot) =>
        slot.date === selectedDate &&
        slot.startTime <= time &&
        slot.endTime > time
    );
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            SyncSchedule
          </h1>
          <p className="text-gray-300 text-lg">
            Collaborative scheduling made simple
          </p>
        </div>

        {/* User Management */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Team Members
          </h2>

          <div className="flex flex-wrap gap-3 mb-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all cursor-pointer ${
                  currentUser === user.id
                    ? "border-white bg-white/20"
                    : "border-white/30 hover:border-white/50"
                }`}
                onClick={() => setCurrentUser(user.id)}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span className="font-medium">{user.name}</span>
                {users.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUser(user.id);
                    }}
                    className="ml-2 p-1 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add team member..."
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addUser()}
              className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-white/50"
            />
            <button
              onClick={addUser}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Calendar Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Schedule
            </h2>

            {/* Date Selection */}
            <div className="mb-4 md:mb-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-2">
                {generateCalendarDays().map((date) => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNum = dateObj.getDate();
                  const isSelected = date === selectedDate;

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 md:p-3 rounded-lg text-center transition-all text-xs md:text-sm ${
                        isSelected
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                    >
                      <div className="text-xs opacity-80">{dayName}</div>
                      <div className="text-sm md:text-lg font-bold">
                        {dayNum}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Event Button */}
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Busy Time
            </button>

            {/* Add Event Form */}
            {showAddEvent && (
              <div className="bg-white/20 rounded-lg p-3 md:p-4 mb-4">
                <input
                  type="text"
                  placeholder="Event title (optional)"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full mb-3 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-white/50 text-sm md:text-base"
                />
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="px-2 md:px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 text-sm"
                  />
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    className="px-2 md:px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addBusySlot}
                    className="flex-1 px-3 md:px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors text-sm md:text-base"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddEvent(false)}
                    className="px-3 md:px-4 py-2 bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Time Slots */}
            <div className="space-y-1 md:space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
              {getTimeSlots().map((time) => {
                const slotsAtTime = getSlotsForTime(time);
                const hasSlots = slotsAtTime.length > 0;

                return (
                  <div
                    key={time}
                    className={`flex items-center p-2 md:p-3 rounded-lg transition-all ${
                      hasSlots
                        ? "bg-red-500/20 border border-red-500/30"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="w-12 md:w-16 text-xs md:text-sm font-mono flex-shrink-0">
                      {time}
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1 md:gap-2 ml-2">
                      {slotsAtTime.map((slot) => {
                        const user = users.find((u) => u.id === slot.userId);
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: user?.color + "40",
                              border: `1px solid ${user?.color}`,
                            }}
                          >
                            <span className="font-medium">{user?.name}</span>
                            {slot.title && (
                              <span className="opacity-80 hidden sm:inline">
                                - {slot.title}
                              </span>
                            )}
                            <button
                              onClick={() => removeBusySlot(slot.id)}
                              className="ml-1 p-0.5 hover:bg-red-500/20 rounded-full transition-colors"
                            >
                              <X className="w-2 h-2 md:w-3 md:h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 md:w-6 md:h-6" />
              AI Scheduling Assistant
            </h2>

            {/* Chat Messages */}
            <div className="flex-1 bg-white/5 rounded-lg p-3 md:p-4 mb-4 max-h-64 md:max-h-80 overflow-y-auto">
              <div className="space-y-3">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-2 md:p-3 rounded-lg text-sm md:text-base ${
                        message.isUser
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {!message.isUser && (
                        <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
                          <Bot className="w-3 h-3" />
                          <span>AI Assistant</span>
                        </div>
                      )}
                      <div className="whitespace-pre-line">{message.text}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask me about availability..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  aiInput.trim() &&
                  processAIMessage(aiInput)
                }
                className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-white/50 text-sm md:text-base"
              />
              <button
                onClick={() => aiInput.trim() && processAIMessage(aiInput)}
                disabled={!aiInput.trim()}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline text-sm md:text-base">
                  Send
                </span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3 flex flex-wrap gap-1 md:gap-2">
              {[
                "Is everyone free tomorrow at 2 PM?",
                "Best time for a meeting this week?",
                "Who's available Friday morning?",
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => processAIMessage(suggestion)}
                  className="px-2 md:px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
