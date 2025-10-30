"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Bell,
  Clock,
  Check,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import { API } from "@/services";

interface Reminder {
  id: string;
  user_id: string;
  message: string;
  remind_at: string;
  is_sent: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const RemindersPage = ({ reminder }: any) => {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>(reminder);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">(
    "all"
  );
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    message: "",
    date: "",
    time: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    calculateStats(reminder);
  }, [reminder]);

  const calculateStats = (remindersList: Reminder[]) => {
    const now = new Date();
    const total = remindersList.length;
    const completed = remindersList.filter((r) => r.is_completed).length;
    const upcoming = remindersList.filter(
      (r) => !r.is_completed && new Date(r.remind_at) > now
    ).length;
    const overdue = remindersList.filter(
      (r) => !r.is_completed && new Date(r.remind_at) < now
    ).length;

    setStats({ total, upcoming, completed, overdue });
  };

  const formatTimeForDisplay = (time: string): string => {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString); 
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const options: any = { weekday: "short", month: "short", day: "numeric" };

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    else if (date.toDateString() === tomorrow.toDateString()) {
      const timeOptions: any = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      const time = date.toLocaleTimeString("en-US", {
        ...timeOptions,
        timeZone: "UTC",
      }); 
      return `Tomorrow at ${time}`;
    }
    else {
      return date.toLocaleDateString("en-US", options); 
    }
  };

  const isOverdue = (remindAt: string): boolean => {
    return new Date(remindAt) < new Date();
  };

  const getFilteredReminders = () => {
    const now = new Date();

    return reminders.filter((reminder) => {
      const reminderTime = new Date(reminder.remind_at);

      switch (activeTab) {
        case "upcoming":
          return !reminder.is_completed && reminderTime > now;
        case "completed":
          return reminder.is_completed;
        default:
          return true;
      }
    });
  };

  const getSortedReminders = () => {
    const filtered = getFilteredReminders();
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.remind_at).getTime();
      const bTime = new Date(b.remind_at).getTime();
      return activeTab === "upcoming" ? aTime - bTime : bTime - aTime;
    });
  };

  const toggleReminderCompletion = async (
    reminderId: string,
    reminder: any
  ) => {
    await API.updateReminder(reminderId, {
      is_completed: !Boolean(reminder?.is_completed),
    });
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === reminderId
        ? {
            ...reminder,
            is_completed: !reminder.is_completed,
            updated_at: new Date().toISOString(),
          }
        : reminder
    );
    setReminders(updatedReminders);
    calculateStats(updatedReminders);
  };

  const deleteReminder = async (reminderId: string) => {
    await API.deleteReminder(reminderId);
    const updatedReminders = reminders.filter(
      (reminder) => reminder.id !== reminderId
    );
    setReminders(updatedReminders);
    calculateStats(updatedReminders);
  };

  const handleAddReminder = () => {
    if (!newReminder.message || !newReminder.date || !newReminder.time) {
      return;
    }

    const remindAt = new Date(`${newReminder.date}T${newReminder.time}:00`);

    const newReminderObj: Reminder = {
      id: Date.now().toString(),
      user_id: "f83ac7cb-db93-4917-bc06-da38ab3bb696",
      message: newReminder.message,
      remind_at: remindAt.toISOString(),
      is_sent: false,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    API.addReminder({
      message: newReminder.message,
      remind_at: remindAt.toISOString(),
    });

    const updatedReminders = [...reminders, newReminderObj];
    setReminders(updatedReminders);
    calculateStats(updatedReminders);
    setIsAddReminderModalOpen(false);
    setNewReminder({ message: "", date: "", time: "" });
  };

  const sortedReminders = getSortedReminders();

  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (starsRef.current) {
      starsRef.current.innerHTML = "";
      for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.className = "absolute bg-white rounded-full animate-pulse";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.opacity = `${Math.random() * 0.8 + 0.2}`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsRef.current.appendChild(star);
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-black from-slate-950 bg-gradient-to-b">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Reminders
          </h1>
          <button
            onClick={() => setIsAddReminderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            <Plus size={16} />
            Add Reminder
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              activeTab === "all" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Reminders
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              activeTab === "upcoming" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.upcoming}
            </p>
          </div>
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              activeTab === "completed" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveTab("completed")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completed
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completed}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">
              {stats.overdue}
            </p>
          </div>
        </div>

        {activeTab !== "all" && (
          <div className="flex items-center mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <Filter size={16} className="text-blue-500 mr-2" />
            <span className="text-blue-700 dark:text-blue-300">
              Showing {activeTab} reminders ({sortedReminders.length})
            </span>
            <button
              onClick={() => setActiveTab("all")}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

        <div className="space-y-4">
          {sortedReminders.length > 0 ? (
            sortedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 ${
                  reminder.is_completed
                    ? "border-green-500"
                    : isOverdue(reminder.remind_at)
                    ? "border-red-500"
                    : "border-blue-500"
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        reminder.is_completed
                          ? "bg-green-100 dark:bg-green-900"
                          : isOverdue(reminder.remind_at)
                          ? "bg-red-100 dark:bg-red-900"
                          : "bg-blue-100 dark:bg-blue-900"
                      }`}
                    >
                      {reminder.is_completed ? (
                        <Check
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                      ) : isOverdue(reminder.remind_at) ? (
                        <AlertCircle
                          size={16}
                          className="text-red-600 dark:text-red-400"
                        />
                      ) : (
                        <Bell
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          reminder.is_completed
                            ? "text-gray-500 dark:text-gray-400 line-through"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {reminder.message}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} className="mr-1" />
                          <span
                            className={
                              isOverdue(reminder.remind_at) &&
                              !reminder.is_completed
                                ? "text-red-500 dark:text-red-400"
                                : ""
                            }
                          >
                            {formatDateForDisplay(reminder.remind_at)}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="mr-1" />
                          <span
                            className={
                              isOverdue(reminder.remind_at) &&
                              !reminder.is_completed
                                ? "text-red-500 dark:text-red-400"
                                : ""
                            }
                          >
                            {formatTimeForDisplay(reminder.remind_at)}
                          </span>
                        </div>
                        {isOverdue(reminder.remind_at) &&
                          !reminder.is_completed && (
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                              Overdue
                            </span>
                          )}
                        {reminder.is_completed && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() =>
                        toggleReminderCompletion(
                          reminder.id,
                          reminder.is_completed
                        )
                      }
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        reminder.is_completed
                          ? "bg-green-500 text-white"
                          : "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={
                        reminder.is_completed
                          ? "Mark as incomplete"
                          : "Mark as complete"
                      }
                    >
                      {reminder.is_completed && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                      title="Delete reminder"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded shadow">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === "all"
                  ? "No reminders yet"
                  : `No ${activeTab} reminders found`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === "all"
                  ? "Start by adding your first reminder or chat with your mentor AI."
                  : "Try changing your filter to see more reminders."}
              </p>
              {activeTab === "all" && (
                <button
                  onClick={() => setIsAddReminderModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  <Plus size={16} />
                  Add Reminder
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                How Reminders Work
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your mentor AI will automatically send you a chat message about
                10 minutes before each reminder's scheduled time. You can also
                create reminders by chatting with your mentor - try saying
                "Remind me to drink water at 3 PM".
              </p>
            </div>
          </div>
        </div>
      </main>

      {isAddReminderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Reminder
              </h2>
              <button
                onClick={() => setIsAddReminderModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="message"
                    value={newReminder.message}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        message: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What should I remind you about?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={newReminder.date}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={newReminder.time}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsAddReminderModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
