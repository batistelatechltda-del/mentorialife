"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Target,
  BookOpen,
  Bell,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";

const Sidebar = ({ sidebarData }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatTimeForDisplay = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength = 50): string => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const options: any = { weekday: "short", month: "short", day: "numeric" };

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
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
    } else {
      return date.toLocaleDateString("en-US", options);
    }
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    count,
  }: {
    icon: any;
    title: string;
    count: number;
  }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          {title}
        </h3>
      </div>
      {count > 0 && (
        <span className="bg-blue-900/50 border border-blue-500/30 text-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );

  const EmptyState = ({ message, icon }: { message: string; icon: string }) => (
    <div className="text-center py-4">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs text-purple-300/70">{message}</p>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  return (
    <nav className="h-full flex flex-col bg-black/40 border-r border-white/10">
      <div className="py-4 px-4 border-b border-white/10">
        <div className="logo text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          MentorAI
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
        {/* Goals */}
        <div className="space-y-3">
          <SectionHeader
            icon={Target}
            title="Today's Goals"
            count={sidebarData.goals?.length || 0}
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : sidebarData.goals?.length > 0 ? (
            <div className="flex flex-col gap-y-2">
              {sidebarData.goals.slice(0, 3).map((goal: any, index: any) => (
                <Link href="/dashboard/goals" key={index}>
                  <div className="group p-3 bg-black/30 border border-white/10 rounded-lg cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-white leading-relaxed">
                        {truncateText(goal.title || "", 60)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {sidebarData.goals.length > 3 && (
                <p className="text-xs text-purple-300/70 text-center">
                  +{sidebarData.goals.length - 3} more goals
                </p>
              )}
            </div>
          ) : (
            <EmptyState message="No goals set for today" icon="🎯" />
          )}
          <Link
            href="/dashboard/goals"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium group"
          >
            View All Goals
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Journals */}
        <div className="space-y-3">
          <SectionHeader
            icon={BookOpen}
            title="Recent Journals"
            count={sidebarData.journals?.length || 0}
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : sidebarData.journals?.length > 0 ? (
            <div className="space-y-2">
              {sidebarData.journals
                .slice(0, 3)
                .map((journal: any, index: any) => (
                  <div
                    key={index}
                    className="group p-3 bg-black/30 border border-white/10 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-3 w-3 text-purple-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-white leading-relaxed">
                        {truncateText(journal.content || "", 80)}
                      </p>
                    </div>
                  </div>
                ))}
              {sidebarData.journals.length > 2 && (
                <p className="text-xs text-purple-300/70 text-center">
                  +{sidebarData.journals.length - 2} more entries
                </p>
              )}
            </div>
          ) : (
            <EmptyState message="No journal entries yet" icon="📝" />
          )}
          <Link
            href="/dashboard/journal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium group"
          >
            View Journal
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Events */}
        <div className="space-y-3">
          <SectionHeader
            icon={Calendar}
            title="Upcoming Events"
            count={sidebarData.calendarEvents?.length || 0}
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : sidebarData.calendarEvents?.length > 0 ? (
            <div className="space-y-2">
              {sidebarData.calendarEvents
                .slice(0, 3)
                .map((event: any, index: any) => (
                  <div
                    key={index}
                    className="group p-3 bg-black/30 border border-white/10 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-relaxed">
                          {truncateText(event.title || "No Title", 50)}
                        </p>
                        {event.date && (
                          <p className="text-xs text-blue-300/70 mt-1">
                            {formatDate(event.date)}{" "}
                            {event.time &&
                              `at ${formatTimeForDisplay(event.time)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState message="No upcoming events" icon="📅" />
          )}
          <Link
            href="/dashboard/calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium group"
          >
            View Calendar
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Reminders */}
        <div className="space-y-3">
          <SectionHeader
            icon={Bell}
            title="Active Reminders"
            count={sidebarData.reminders?.length || 0}
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : sidebarData.reminders?.length > 0 ? (
            <div className="space-y-2">
              {sidebarData.reminders.slice(0, 3).map((reminder: any) => (
                <div
                  key={reminder.id}
                  className="group p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <Bell className="h-3 w-3 text-amber-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed">
                        {truncateText(reminder.message || "", 60)}
                      </p>
                      {reminder.remind_at && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <p className="text-xs text-amber-300/80">
                            {formatDateForDisplay(reminder.remind_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sidebarData.reminders.length > 3 && (
                <p className="text-xs text-purple-300/70 text-center">
                  +{sidebarData.reminders.length - 3} more reminders
                </p>
              )}
            </div>
          ) : (
            <EmptyState message="No active reminders" icon="⏰" />
          )}
          <Link
            href="/dashboard/reminders"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium group"
          >
            View Reminders
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => router.refresh()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white hover:text-purple-200 hover:bg-white/10 rounded-lg border border-white/10"
        >
          <Plus className="h-3 w-3" />
          Refresh Data
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
