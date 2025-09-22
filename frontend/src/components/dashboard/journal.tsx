"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Bot,
  User,
  Edit3,
  Trash2,
} from "lucide-react";
import { API } from "@/services";

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  is_auto: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const JournalPage = ({ journal }: any) => {
  const router = useRouter();
  const [journalInput, setJournalInput] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>(journal);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "auto" | "manual">("all");

  const handleSubmit = async () => {
    if (!journalInput.trim()) return;

    setIsLoading(true);

    const newEntry: any = {
      content: journalInput.trim(),
      is_auto: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await API.addJournal({ content: journalInput.trim(), is_auto: false });

    setEntries([newEntry, ...entries]);
    setJournalInput("");
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    await API.deleteJournal(entryId);
    setEntries(entries.filter((entry) => entry.id !== entryId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const filteredEntries = entries.filter((entry) => {
    switch (filter) {
      case "auto":
        return entry.is_auto;
      case "manual":
        return !entry.is_auto;
      default:
        return true;
    }
  });

  const stats = {
    total: entries.length,
    auto: entries.filter((e) => e.is_auto).length,
    manual: entries.filter((e) => !e.is_auto).length,
    today: entries.filter((e) => isToday(e.created_at)).length,
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
  onClick={() => router.push("/dashboard")}
  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
>
  <ArrowLeft size={18} className="mr-2" />
  <span>Back</span>
</button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Journal
          </h1>
         
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              filter === "all" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Entries
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              filter === "auto" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setFilter("auto")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Auto-Generated
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.auto}
            </p>
          </div>
          <div
            className={`bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer transition-colors ${
              filter === "manual" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setFilter("manual")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manual Entries
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.manual}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.today}
            </p>
          </div>
        </div>

        {filter !== "all" && (
          <div className="flex items-center mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <span className="text-blue-700 dark:text-blue-300">
              Showing {filter} entries ({filteredEntries.length})
            </span>
            <button
              onClick={() => setFilter("all")}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
              <Edit3 size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What's on your mind today? Share your thoughts, feelings, or experiences..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to add entry
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!journalInput.trim() || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.is_auto
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-green-100 dark:bg-green-900"
                      }`}
                    >
                      {entry.is_auto ? (
                        <Bot
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      ) : (
                        <User
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            entry.is_auto
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                              : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {entry.is_auto ? "Auto-Generated" : "Manual Entry"}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="mr-1" />
                          {isToday(entry.created_at) ? (
                            <span>Today at {formatTime(entry.created_at)}</span>
                          ) : (
                            <span>
                              {formatDate(entry.created_at)} at{" "}
                              {formatTime(entry.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Edit3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === "all"
                  ? "No journal entries yet"
                  : `No ${filter} entries found`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {filter === "all"
                  ? "Start by writing your first journal entry above."
                  : "Try changing your filter to see more entries."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JournalPage;
