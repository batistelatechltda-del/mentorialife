"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  Clock,
  List,
  Grid,
  Check,
  X,
  Edit3,
  Trash2,
} from "lucide-react";
import { API } from "@/services";

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const CalendarPage = ({ initEvents }: any) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initEvents);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });


  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      year: "2-digit",
      hour12: true,
    });
  };

  const hasEvents = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);

    return events.some((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const toggleEventCompletion = async (eventId: string, even: any) => {
    await API.updateEvent(eventId, {
      is_completed: !even.is_completed,
    });

    setEvents(
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              is_completed: !event.is_completed,
              updated_at: new Date().toISOString(),
            }
          : event
      )
    );
  };

  const deleteEvent = async (eventId: string) => {
    await API.deleteEvent(eventId);
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    const eventDate = new Date(event.start_time);
    const startTime = eventDate.toTimeString().slice(0, 5);
    const endTime = new Date(event.end_time).toTimeString().slice(0, 5);

    setNewEvent({
      title: event.title,
      description: event.description || "",
      date: eventDate.toISOString().split("T")[0],
      startTime: startTime,
      endTime: endTime,
    });
    setIsEditEventModalOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (
      !editingEvent ||
      !newEvent.title ||
      !newEvent.date ||
      !newEvent.startTime ||
      !newEvent.endTime
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const startTime = new Date(`${newEvent.date}T${newEvent.startTime}:00`);
    const endTime = new Date(`${newEvent.date}T${newEvent.endTime}:00`);

    const updatedEvent: CalendarEvent = {
      ...editingEvent,
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      updated_at: new Date().toISOString(),
    };

    await API.updateEvent(editingEvent?.id, {
      title: updatedEvent.title,
      description: updatedEvent.description,
      start_time: updatedEvent?.start_time,
      end_time: updatedEvent?.end_time,
    });

    setEvents(
      events.map((event) =>
        event.id === editingEvent.id ? updatedEvent : event
      )
    );
    setIsEditEventModalOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const closeModal = () => {
    setIsAddEventModalOpen(false);
    setIsEditEventModalOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleAddEvent = () => {
    if (
      !newEvent.title ||
      !newEvent.date ||
      !newEvent.startTime ||
      !newEvent.endTime
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const startTime = new Date(`${newEvent.date}T${newEvent.startTime}:00`);
    const endTime = new Date(`${newEvent.date}T${newEvent.endTime}:00`);

    const newCalendarEvent: CalendarEvent = {
      id: Date.now().toString(),
      user_id: "f83ac7cb-db93-4917-bc06-da38ab3bb696",
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    API.createEvent({
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    setEvents([newCalendarEvent, ...events]);
    setIsAddEventModalOpen(false);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];
    const rows = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
      const day = daysInPrevMonth - firstDayOfMonth + i + 1;

      days.push(
        <td
          key={`prev-${i}`}
          className="p-1 text-center text-gray-400 dark:text-gray-600"
        >
          <div className="h-8 w-8 rounded-full mx-auto flex items-center justify-center text-sm">
            {day}
          </div>
        </td>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      const dayHasEvents = hasEvents(day);

      days.push(
        <td key={`day-${day}`} className="p-1">
          <div
            className={`relative h-24 border border-gray-200 dark:border-gray-700 rounded-md p-1 ${
              isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-sm mb-1 ${
                isToday
                  ? " text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {day}
            </div>

            {dayHasEvents && (
              <div className="overflow-y-auto max-h-12">
                {getEventsForDay(day)
                  .slice(0, 2)
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`group text-xs p-1 mb-1 rounded truncate cursor-pointer relative ${
                        event.is_completed
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      }`}
                      onClick={() => handleEditEvent(event)}
                      title={`${event.title || "No Title"} - Click to edit`}
                    >
                      <span
                        className={event.is_completed ? "line-through" : ""}
                      >
                        {event.title || "No Title"}
                      </span>
                      <div className="absolute right-0 top-0 hidden group-hover:flex bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventCompletion(event.id, event.is_completed);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l"
                          title={
                            event.is_completed
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                        >
                          <Check
                            size={10}
                            className={
                              event.is_completed
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r text-red-600"
                          title="Delete event"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                {getEventsForDay(day).length > 2 && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                    +{getEventsForDay(day).length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        </td>
      );
    }

    const totalCells = days.length;
    const remainingCells = 42 - totalCells; 

    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <td
          key={`next-${i}`}
          className="p-1 text-center text-gray-400 dark:text-gray-600"
        >
          <div className="h-8 w-8 rounded-full mx-auto flex items-center justify-center text-sm">
            {i}
          </div>
        </td>
      );
    }

    for (let i = 0; i < days.length; i += 7) {
      rows.push(<tr key={`row-${i / 7}`}>{days.slice(i, i + 7)}</tr>);
    }

    return rows;
  };

  const getUpcomingEvents = () => {
    return events;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                All Events
              </h2>

              {getUpcomingEvents().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingEvents().map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md border ${
                        event.is_completed
                          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                          : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`font-medium ${
                              event.is_completed
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {event.title || "No Title"}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarIcon size={12} className="mr-1" />
                            <span>{formatEventDate(event.start_time)}</span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock size={12} className="mr-1" />
                            <span>
                              {formatTime(event.start_time)} -{" "}
                              {formatTime(event.end_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() =>
                              toggleEventCompletion(
                                event.id,
                                event.is_completed
                              )
                            }
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              event.is_completed
                                ? "bg-green-500 text-white"
                                : "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            title={
                              event.is_completed
                                ? "Mark as incomplete"
                                : "Mark as complete"
                            }
                          >
                            {event.is_completed && <Check size={12} />}
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            title="Edit event"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Delete event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center mb-4 sm:mb-0">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mx-4">
                    {formatDate(currentDate)}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-4 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                  >
                    Today
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setView("month")}
                    className={`p-2 rounded ${
                      view === "month"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setView("week")}
                    className={`p-2 rounded ${
                      view === "week"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <CalendarIcon size={18} />
                  </button>
                  <button
                    onClick={() => setView("day")}
                    className={`p-2 rounded ${
                      view === "day"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Sun
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mon
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tue
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Wed
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Thu
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Fri
                      </th>
                      <th className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Sat
                      </th>
                    </tr>
                  </thead>
                  <tbody>{renderCalendarGrid()}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {(isAddEventModalOpen || isEditEventModalOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditEventModalOpen ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Event description"
                    rows={3}
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
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              {isEditEventModalOpen && (
                <button
                  onClick={() => deleteEvent(editingEvent!.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={
                  isEditEventModalOpen ? handleUpdateEvent : handleAddEvent
                }
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                {isEditEventModalOpen ? "Update Event" : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
