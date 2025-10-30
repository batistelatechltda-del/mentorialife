export interface Reminder {
  id: string;
  task: string;
  startTime: string; 
  startDate: string; 
  repeating: "none" | "daily" | "hourly" | "custom";
  repeatFrequency?: number; 
  triggerWindow: number; 
  completed: boolean;
  lastTriggered?: number; 
  nextTrigger?: number; 
  createdAt: string; 
}

const REMINDERS_STORAGE_KEY = "mentorAI_reminders";
const SENT_REMINDERS_KEY = "mentorAI_sentReminders";

export const REMINDER_EVENT = "mentorReminderTriggered";

class ReminderUtils {
  private reminders: Reminder[] = [];
  private sentReminders: Map<string, number> = new Map(); 
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadReminders();
    this.loadSentReminders();
    this.startReminderChecker();
  }

  loadReminders(): void {
    if (typeof window !== "undefined") {
      try {
        const savedReminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
        if (savedReminders) {
          this.reminders = JSON.parse(savedReminders);

          this.recalculateAllTriggers();
        }
      } catch (error) {
        console.error("Error loading reminders:", error);
        this.reminders = [];
      }
    }
  }

  loadSentReminders(): void {
    if (typeof window !== "undefined") {
      try {
        const savedSentReminders = localStorage.getItem(SENT_REMINDERS_KEY);
        if (savedSentReminders) {
          const sentRemindersArray = JSON.parse(savedSentReminders);
          this.sentReminders = new Map(sentRemindersArray);

          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

          Array.from(this.sentReminders.entries()).forEach(
            ([id, timestamp]) => {
              if (timestamp < oneDayAgo) {
                this.sentReminders.delete(id);
              }
            }
          );
        }
      } catch (error) {
        console.error("Error loading sent reminders:", error);
        this.sentReminders = new Map();
      }
    }
  }

  saveReminders(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          REMINDERS_STORAGE_KEY,
          JSON.stringify(this.reminders)
        );
      } catch (error) {
        console.error("Error saving reminders:", error);
      }
    }
  }

  saveSentReminders(): void {
    if (typeof window !== "undefined") {
      try {
        const sentRemindersArray = Array.from(this.sentReminders.entries());
        localStorage.setItem(
          SENT_REMINDERS_KEY,
          JSON.stringify(sentRemindersArray)
        );
      } catch (error) {
        console.error("Error saving sent reminders:", error);
      }
    }
  }

  getReminders(): Reminder[] {
    return this.reminders;
  }

  getActiveReminders(): Reminder[] {
    return this.reminders.filter((r) => !r.completed);
  }

  getTodayReminders(): Reminder[] {
    const today = new Date().toISOString().split("T")[0];
    return this.reminders.filter(
      (r) => !r.completed && (r.startDate === today || r.repeating !== "none")
    );
  }

  getUpcomingReminders(): Reminder[] {
    const now = Date.now();
    const in24Hours = now + 24 * 60 * 60 * 1000;

    return this.reminders.filter(
      (r) =>
        !r.completed &&
        r.nextTrigger &&
        r.nextTrigger >= now &&
        r.nextTrigger <= in24Hours
    );
  }

  createReminder(
    task: string,
    startTime: string,
    startDate: string = new Date().toISOString().split("T")[0],
    repeating: "none" | "daily" | "hourly" | "custom" = "none",
    repeatFrequency?: number,
    triggerWindow: number = 10
  ): Reminder {
    const id = `rem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newReminder: Reminder = {
      id,
      task,
      startTime,
      startDate,
      repeating,
      repeatFrequency,
      triggerWindow,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.calculateNextTrigger(newReminder);

    this.reminders.push(newReminder);
    this.saveReminders();

    return newReminder;
  }

  updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    const index = this.reminders.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updatedReminder = { ...this.reminders[index], ...updates };

    if (
      updates.startTime !== undefined ||
      updates.startDate !== undefined ||
      updates.repeating !== undefined ||
      updates.repeatFrequency !== undefined ||
      updates.triggerWindow !== undefined
    ) {
      this.calculateNextTrigger(updatedReminder);
    }

    this.reminders[index] = updatedReminder;
    this.saveReminders();

    return updatedReminder;
  }

  completeReminder(id: string): Reminder | null {
    return this.updateReminder(id, { completed: true });
  }

  deleteReminder(id: string): boolean {
    const initialLength = this.reminders.length;
    this.reminders = this.reminders.filter((r) => r.id !== id);

    if (this.reminders.length !== initialLength) {
      this.saveReminders();
      return true;
    }

    return false;
  }

  parseReminderText(text: string): {
    task: string;
    time: string;
    date: string;
    repeating: "none" | "daily" | "hourly" | "custom";
    frequency?: number;
  } | null {

    try {
      const lowerText = text.toLowerCase();

      const timePatterns = [
        /\b(at|around|about|by|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|noon|midnight)?)\b/i,
        /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))\b/i,
        /\b(noon|midnight)\b/i,
        /\b(\d{1,2})\s+o'?clock\s*(am|pm|a\.m\.|p\.m\.)?/i,
        /\b(this|in the|later this)\s+(morning|afternoon|evening|night)\b/i,
      ];

      let timeMatch = null;
      let matchedPattern = null;

      for (const pattern of timePatterns) {
        const match = lowerText.match(pattern);
        if (match) {
          timeMatch = match;
          matchedPattern = pattern;
          break;
        }
      }

      if (!timeMatch) {
        const aiConfirmationMatch = lowerText.match(
          /(?:i'll|i will) remind you (?:to|about|for)\s+.*?\s+(?:at|around|by|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
        );
        if (aiConfirmationMatch) {
          timeMatch = aiConfirmationMatch;
          matchedPattern = timePatterns[0]; 
        }
      }

      if (!timeMatch) {

        if (lowerText.includes("this morning")) {
          timeMatch = ["this morning", "this", "morning"];
          matchedPattern = timePatterns[4];
        } else if (lowerText.includes("this afternoon")) {
          timeMatch = ["this afternoon", "this", "afternoon"];
          matchedPattern = timePatterns[4];
        } else if (lowerText.includes("this evening")) {
          timeMatch = ["this evening", "this", "evening"];
          matchedPattern = timePatterns[4];
        } else if (lowerText.includes("tonight")) {
          timeMatch = ["tonight", "this", "night"];
          matchedPattern = timePatterns[4];
        } else {
          return null;
        }
      }


      let hours = 0;
      let minutes = 0;

      if (timeMatch[0].includes("noon")) {
        hours = 12;
        minutes = 0;
      } else if (timeMatch[0].includes("midnight")) {
        hours = 0;
        minutes = 0;
      } else if (matchedPattern === timePatterns[4]) {
        const period = timeMatch[2].toLowerCase();
        if (period === "morning") {
          hours = 9; 
          minutes = 0;
        } else if (period === "afternoon") {
          hours = 14; 
          minutes = 0;
        } else if (period === "evening" || period === "night") {
          hours = 19; 
          minutes = 0;
        }
      } else if (matchedPattern === timePatterns[3]) {
        hours = parseInt(timeMatch[1], 10);
        minutes = 0;

        const period = timeMatch[2]?.toLowerCase() || "";
        if (period.includes("pm") && hours < 12) {
          hours += 12;
        } else if (period.includes("am") && hours === 12) {
          hours = 0;
        } else if (!period && hours < 12) {
          const currentHour = new Date().getHours();
          if (currentHour >= 12 && hours >= 1 && hours <= 6) {
            hours += 12;
          }
        }
      } else {
        const timeStr = (timeMatch[2] || timeMatch[1]).trim();

        const hasColon = timeStr.includes(":");

        if (hasColon) {
          const parts = timeStr.split(":");
          hours = parseInt(parts[0], 10);

          const minutePart = parts[1];
          minutes = parseInt(minutePart.replace(/[^\d]/g, ""), 10);

          const isPM = minutePart.toLowerCase().includes("pm");
          const isAM = minutePart.toLowerCase().includes("am");

          if (isPM && hours < 12) {
            hours += 12;
          } else if (isAM && hours === 12) {
            hours = 0;
          }
        } else {
          const hourPart = parseInt(timeStr.replace(/[^\d]/g, ""), 10);
          hours = hourPart;
          minutes = 0;

          const isPM = timeStr.toLowerCase().includes("pm");
          const isAM = timeStr.toLowerCase().includes("am");

          if (isPM && hours < 12) {
            hours += 12;
          } else if (isAM && hours === 12) {
            hours = 0;
          }
        }

        if (
          !timeStr.toLowerCase().includes("am") &&
          !timeStr.toLowerCase().includes("pm") &&
          hours >= 1 &&
          hours <= 7
        ) {
          const morningContextClues = ["morning", "breakfast", "wake", "early"];
          const eveningContextClues = [
            "evening",
            "night",
            "dinner",
            "late",
            "tonight",
          ];
          const afternoonContextClues = ["afternoon", "lunch", "midday"];

          const hasEveningContext = eveningContextClues.some((clue) =>
            lowerText.includes(clue)
          );
          const hasAfternoonContext = afternoonContextClues.some((clue) =>
            lowerText.includes(clue)
          );
          const hasMorningContext = morningContextClues.some((clue) =>
            lowerText.includes(clue)
          );

          if (hasEveningContext || hasAfternoonContext) {
            hours += 12; 
          }

          if (
            !hasEveningContext &&
            !hasAfternoonContext &&
            !hasMorningContext
          ) {
            const currentHour = new Date().getHours();
            if (currentHour >= 12 && hours >= 1 && hours <= 7) {
              hours += 12; 
            }
          }
        }
      }

      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      let repeating: "none" | "daily" | "hourly" | "custom" = "none";
      let frequency: number | undefined = undefined;

      if (lowerText.includes("every day") || lowerText.includes("daily")) {
        repeating = "daily";
      } else if (
        lowerText.includes("every morning") ||
        lowerText.includes("each morning")
      ) {
        repeating = "daily";
        if (hours >= 12 && hours !== 12) {
          hours = hours - 12;
          const updatedTime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        }
      } else if (
        lowerText.includes("every night") ||
        lowerText.includes("each night") ||
        lowerText.includes("every evening") ||
        lowerText.includes("each evening")
      ) {
        repeating = "daily";
        if (hours < 12) {
          hours = hours + 12;
          const updatedTime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        }
      } else if (
        lowerText.includes("every hour") ||
        lowerText.includes("hourly")
      ) {
        repeating = "hourly";
        frequency = 1;
      } else if (lowerText.match(/every\s+(\d+)\s+hours?/)) {
        repeating = "hourly";
        const match = lowerText.match(/every\s+(\d+)\s+hours?/);
        frequency = match ? parseInt(match[1], 10) : 1;
      } else if (
        lowerText.match(
          /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
        )
      ) {
        repeating = "custom";
      }

      let task = "";

      if (matchedPattern === timePatterns[0]) {
        const parts = text.split(
          new RegExp(timeMatch[1] + "\\s+" + timeMatch[2], "i")
        );
        task = parts[0].trim();
      } else if (matchedPattern === timePatterns[4]) {
        const parts = text.split(timeMatch[0]);
        task = parts[0].trim();
      } else {
        const parts = text.split(timeMatch[0]);
        task = parts[0].trim();

        if (
          parts.length > 1 &&
          !parts[1].trim().match(/^(every|each|daily)/i)
        ) {
          const postContent = parts[1].trim();
          if (postContent && !postContent.match(/^(every|each|daily)/i)) {
            task += " " + postContent;
          }
        }
      }

      if (lowerText.match(/(?:i'll|i will) remind you/i)) {
        const reminderMatch = lowerText.match(
          /(?:i'll|i will) remind you (?:to|about|for)?\s+([^]*?)(?:\s+at|by|around|for)/i
        );
        if (reminderMatch && reminderMatch[1]) {
          task = reminderMatch[1].trim();
        }
      }

      const cleanupPhrases = [
        "remind me to",
        "don't forget to",
        "remember to",
        "remind me",
        "please remind me",
        "can you remind me",
        "set a reminder",
        "create a reminder",
        "i need to",
        "i have to",
        "i'll remind you to",
        "i will remind you to",
        "reminder for",
        "reminder to",
      ];

      for (const phrase of cleanupPhrases) {
        if (task.toLowerCase().startsWith(phrase)) {
          task = task.substring(phrase.length).trim();
          break;
        }
      }

      task = task.replace(/[.,:;!?]+$/, "").trim();
      task = task.replace(/\s+(to|a|an|the|for|about)$/, "").trim();

      if (!task || task.length < 2) {
        task = "Reminder";
      }

      let reminderDate = new Date();

      if (lowerText.includes("tomorrow")) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      else if (
        lowerText.match(
          /\b(on|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
        )
      ) {
        const dayMatch = lowerText.match(
          /\b(on|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
        );
        if (dayMatch) {
          const targetDay = dayMatch[2].toLowerCase();
          const daysOfWeek = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const targetDayIndex = daysOfWeek.indexOf(targetDay);

          if (targetDayIndex !== -1) {
            const currentDayIndex = reminderDate.getDay();
            let daysToAdd = 0;

            if (dayMatch[1].toLowerCase() === "next") {
              daysToAdd = 7 + ((targetDayIndex - currentDayIndex + 7) % 7);
            } else {
              daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;

              if (daysToAdd === 0) {
                daysToAdd = 7;
              }
            }

            reminderDate.setDate(reminderDate.getDate() + daysToAdd);
          }
        }
      }

      const formattedDate = reminderDate.toISOString().split("T")[0];

      if (hours !== parseInt(formattedTime.split(":")[0], 10)) {
        const updatedTime = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;

        const result = {
          task: task,
          time: updatedTime,
          date: formattedDate,
          repeating,
          frequency,
        };

        return result;
      } else {
        const result = {
          task: task,
          time: formattedTime,
          date: formattedDate,
          repeating,
          frequency,
        };

        return result;
      }
    } catch (error) {
      console.error("Error parsing reminder text:", error);
      return null;
    }
  }

  startReminderChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000); 

    this.checkReminders();
  }

  stopReminderChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkReminders(): void {
    const now = Date.now();

    const dueReminders = this.reminders.filter(
      (reminder) =>
        !reminder.completed &&
        reminder.nextTrigger &&
        reminder.nextTrigger <= now &&
        (!this.sentReminders.has(reminder.id) ||
          this.sentReminders.get(reminder.id)! + 60 * 60 * 1000 < now) 
    );

    for (const reminder of dueReminders) {
      this.sentReminders.set(reminder.id, now);
      reminder.lastTriggered = now;

      if (reminder.repeating !== "none") {
        this.calculateNextTrigger(reminder);
      }

      const reminderEvent = new CustomEvent(REMINDER_EVENT, {
        detail: {
          reminder: reminder,
          timestamp: now,
        },
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(reminderEvent);
      }
    }

    if (dueReminders.length > 0) {
      this.saveReminders();
      this.saveSentReminders();
    }
  }

  private calculateNextTrigger(reminder: Reminder): void {
    try {
      if (reminder.completed) {
        reminder.nextTrigger = undefined;
        return;
      }

      const [hours, minutes] = reminder.startTime.split(":").map(Number);

      const startDate = new Date(reminder.startDate);
      startDate.setHours(hours, minutes, 0, 0);

      const triggerWindowMs = (reminder.triggerWindow || 10) * 60 * 1000;
      const triggerTime = startDate.getTime() - triggerWindowMs;

      const now = Date.now();

      if (reminder.repeating === "none") {
        if (triggerTime > now) {
          reminder.nextTrigger = triggerTime;
        } else {
          if (reminder.lastTriggered) {
            reminder.nextTrigger = undefined;
          } else {
            reminder.nextTrigger = now + 10000;
          }
        }
        return;
      }

      if (reminder.repeating === "daily") {
        if (triggerTime > now) {
          reminder.nextTrigger = triggerTime;
        } else {
          const tomorrow = new Date(startDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          reminder.nextTrigger = tomorrow.getTime() - triggerWindowMs;
        }
      } else if (reminder.repeating === "hourly") {
        const frequency = reminder.repeatFrequency || 1;
        const frequencyMs = frequency * 60 * 60 * 1000; 

        if (reminder.lastTriggered) {
          reminder.nextTrigger = reminder.lastTriggered + frequencyMs;
        } else if (triggerTime > now) {
          reminder.nextTrigger = triggerTime;
        } else {
          const elapsed = now - triggerTime;
          const cycles = Math.floor(elapsed / frequencyMs) + 1;
          reminder.nextTrigger = triggerTime + cycles * frequencyMs;
        }
      }
    } catch (error) {
      console.error("Error calculating next trigger:", error, reminder);
      reminder.nextTrigger = Date.now() + 24 * 60 * 60 * 1000; 
    }
  }

  private recalculateAllTriggers(): void {
    for (const reminder of this.reminders) {
      if (!reminder.completed) {
        this.calculateNextTrigger(reminder);
      }
    }
    this.saveReminders();
  }

  getNextTriggerDescription(reminder: any): string {
    if (!reminder) return "No upcoming alerts";

    const now = Date.now();
    const triggerTime: any = new Date(reminder);
    const diffMs = triggerTime - now;

    if (diffMs < 0) return "Overdue";

    if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.ceil(diffMs / (60 * 1000));
      return `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.round(diffMs / (60 * 60 * 1000));
      return `In ${hours} hour${hours !== 1 ? "s" : ""}`;
    }

    const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
    return `In ${days} day${days !== 1 ? "s" : ""}`;
  }

  generateReminderMessage(reminder: Reminder): string {
    const [hours, minutes] = reminder.startTime.split(":").map(Number);

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; 
    const displayTime = `${displayHours}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;

    const messages = [
      `Hey, just a heads-up — it's almost time for you to ${reminder.task} at ${displayTime}.`,
      `Don't forget, you wanted me to remind you about ${reminder.task} coming up at ${displayTime}.`,
      `Your ${reminder.task} is coming up soon at ${displayTime}.`,
      `Quick reminder: ${reminder.task} at ${displayTime}.`,
      `I'm chiming in to remind you about ${reminder.task} scheduled for ${displayTime}.`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

const reminderUtils = new ReminderUtils();
export default reminderUtils;
