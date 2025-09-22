import aiLifeMapConnector from "./aiLifeMapConnector";

interface Message {
  text: string;
  sender: "user" | "mentor";
  timestamp: string;
}

interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  time: string;
  timestamp: number;
  source: "auto" | "manual";
  messageId?: string;
}

const CHAT_MEMORY_KEY = "mentorAI_chatMemory";
const DISPLAY_HISTORY_KEY = "mentorAI_displayHistory";
const JOURNAL_ENTRIES_KEY = "journalEntries";

const JOURNAL_TRIGGER_PHRASES = [
  "went to",
  "visited",
  "went",
  "picked up",
  "picked",
  "dropped off",
  "dropped",
  "arrived",
  "left",
  "traveled",
  "drove",
  "flew",
  "walked",
  "ran",
  "workout",
  "exercised",
  "gym",
  "finished",
  "completed",
  "accomplished",
  "achievement",
  "milestone",
  "progress",
  "feeling",
  "feel",
  "felt",
  "emotional",
  "sad",
  "happy",
  "angry",
  "excited",
  "diet",
  "ate",
  "food",
  "meal",
  "drank",
  "drinking",
  "insight",
  "learned",
  "realized",
  "discovered",
  "met",
  "meeting",
  "talk",
  "talked",
  "conversation",
  "called",
  "phoned",
  "texted",
  "message",
  "email",
  "wrote",
  "started",
  "beginning",
  "ending",
  "ended",
  "finished",
  "got",
  "received",
  "bought",
  "purchased",
  "sold",
  "spending",
  "spent",
  "working on",
  "practiced",
  "studying",
  "studied",
  "reading",
  "read",
  "watched",
  "listening",
  "heard",
  "playing",
  "played",
  "cried",
  "crying",
  "laughed",
  "laughing",
  "celebrating",
  "celebrated",
  "party",
  "event",
  "meeting",
  "appointment",
  "doctor",
  "therapy",
  "counseling",
  "meditation",
  "breathing",
  "sleeping",
  "slept",
  "woke up",
  "morning",
  "afternoon",
  "evening",
  "night",
  "today",
  "yesterday",
  "tomorrow",
  "this week",
  "this month",
  "airport",
  "station",
  "dad",
  "mom",
  "father",
  "mother",
  "brother",
  "sister",
  "family",
  "friend",
  "boyfriend",
  "girlfriend",
  "husband",
  "wife",
  "partner",
  "spouse",
];

class ChatUtils {
  private chatHistory: Message[] = [];
  private apiMessages: ApiMessage[] = [];
  private reminderPhrases: string[] = [
    "remind me",
    "don't forget",
    "remember to",
  ];
  private systemPrompt: string =
    "You are MentorAI – a supportive, emotionally intelligent mentor named Jarvis. Your responses should feel genuinely caring and conversational, like talking to a trusted friend or mentor. When users mention tasks with times (e.g. 'Remind me to walk the dog at 7pm' or 'I need to call mom at 15:00'), acknowledge it in your response by saying something like 'I'll remind you to [task] at [time]' - this helps the system detect and save the reminder.\n\nREMINDER SYSTEM: When users ask you to remind them of something, always confirm by saying 'I'll remind you to [task] at [time]' to ensure the reminder gets saved properly in the system.\n\nLIFE MAP RULES: The Life Map currently only has Finance and Health areas active. NEVER ADD ITEMS to Career, Relationships, or other inactive areas unless the user explicitly asks to activate those areas. Only add content to already active areas.\n\nWhen users mention financial activities (like saving money, paying bills, budgeting), you MUST CONFIRM in your response with: 'I've added that to your Finance plan in the Life Map, and updated your progress on [specific activity].' For example, if they say 'I saved $50 for rent', respond with 'Great! I've added that to your Finance plan in the Life Map, and updated your progress on rent payment.'\n\nMANAGING LIFE MAP ITEMS - You have FULL CONTROL to create, edit, complete, and remove items:\n\n1. ADDING ITEMS: Use exact confirmation phrase 'I've added that to your [area] plan in the Life Map' when adding new items. The system detects this phrase to make updates.\n\n2. COMPLETING ITEMS: When users tell you they've finished a task or goal (e.g., 'I sold my car' or 'I finished my workout plan'), CONFIRM by saying 'Great job! I've marked that item as completed in your Life Map.' Use phrases like 'marked as completed', 'marked as done', or 'completed that task' so the system can detect completion status.\n\n3. REMOVING ITEMS: When items are no longer relevant or needed (e.g., 'I don't need to save for a car anymore'), CONFIRM by saying 'I've removed that item from your Life Map.' Use phrases like 'removed that from your [area]', 'deleted that item', or 'cleared that from your Life Map' so the system can detect removal requests.\n\n4. SMART CONFIRMATION FLOWS: When appropriate, ask users if they want to remove completed items: 'I see you've sold your car. Should I remove that goal from your Finance plan?' This keeps the Life Map current and relevant to their changing needs.\n\nORGANIZE WITH STRUCTURE: Create proper hierarchical structures in the Life Map. Use clear node names like 'Pay Rent' (not 'Rent Money' or 'Saving for rent'). Create proper progress tracking by saying '$X saved so far out of $Y needed'.\n\nCREATE DEPENDENT STEPS: When logical sequences exist (like fixing a car then selling it), create dependent steps by mentioning both in your response: 'I've added 'Fix My Car' as a first step, with 'Sell My Car' as a dependent task that follows it.'\n\nTARGETS AND NOTES: Always provide specific targets (e.g., 'Your rent target is $2030') and guidance notes like 'Your goal is to save $X for rent by the end of the month. You've saved $Y so far.'\n\nYour personality is warm, thoughtful, and encouraging. You're here to help users navigate personal development, career growth, finances, health, and general life advice.";

  constructor() {
    this.loadChatMemory();
  }

  loadChatMemory(): void {
    if (typeof window !== "undefined") {
      try {
        const savedDisplayHistory = localStorage.getItem(DISPLAY_HISTORY_KEY);
        if (savedDisplayHistory) {
          try {
            this.chatHistory = JSON.parse(savedDisplayHistory);
          } catch (e) {
            this.chatHistory = [];
            localStorage.removeItem(DISPLAY_HISTORY_KEY);
          }
        }

        const savedApiHistory = localStorage.getItem(CHAT_MEMORY_KEY);
        if (savedApiHistory) {
          try {
            this.apiMessages = JSON.parse(savedApiHistory);
            const hasSystemPrompt = this.apiMessages.some(
              (msg) => msg.role === "system"
            );
            if (!hasSystemPrompt) {
              this.apiMessages = [
                { role: "system", content: this.systemPrompt },
                ...this.apiMessages,
              ];
            }
          } catch (e) {
            this.apiMessages = [{ role: "system", content: this.systemPrompt }];
            localStorage.setItem(
              CHAT_MEMORY_KEY,
              JSON.stringify(this.apiMessages)
            );
          }
        } else {
          this.apiMessages = [{ role: "system", content: this.systemPrompt }];
        }

        if (this.apiMessages.length > 1 && this.chatHistory.length === 0) {
          this.chatHistory = this.apiMessages
            .filter((msg) => msg.role !== "system")
            .map((msg) => ({
              text: msg.content,
              sender: msg.role === "user" ? "user" : "mentor",
              timestamp: new Date().toISOString(),
            }));
          localStorage.setItem(
            DISPLAY_HISTORY_KEY,
            JSON.stringify(this.chatHistory)
          );
        }
      } catch (error) {
        this.chatHistory = [];
        this.apiMessages = [{ role: "system", content: this.systemPrompt }];
        localStorage.removeItem(DISPLAY_HISTORY_KEY);
        localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(this.apiMessages));
      }
    }
  }

  saveChatMemory(): void {
    if (typeof window !== "undefined") {
      try {
        const displayHistoryToSave = this.chatHistory.slice(-50);
        localStorage.setItem(
          DISPLAY_HISTORY_KEY,
          JSON.stringify(displayHistoryToSave)
        );

        const systemMessage = this.apiMessages.find(
          (msg) => msg.role === "system"
        ) || {
          role: "system",
          content: this.systemPrompt,
        };

        const nonSystemMessages = this.apiMessages
          .filter((msg) => msg.role !== "system")
          .slice(-20);

        const apiHistoryToSave = [systemMessage, ...nonSystemMessages];
        localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(apiHistoryToSave));
      } catch (error) {
        console.error("Error saving chat memory:", error);
      }
    }
  }

  getChatHistory(): Message[] {
    return this.chatHistory;
  }

  getApiMessages(): ApiMessage[] {
    return this.apiMessages;
  }

  addMessage(
    text: string,
    sender: "user" | "mentor",
    apiRole: "user" | "assistant" | "system" = "user"
  ): void {
    const newDisplayMessage: Message = {
      text,
      sender,
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(newDisplayMessage);

    const existingApiMessage = this.apiMessages.find(
      (msg) => msg.role === apiRole && msg.content === text
    );

    if (!existingApiMessage) {
      const newApiMessage: ApiMessage = {
        role: apiRole,
        content: text,
      };
      this.apiMessages.push(newApiMessage);
    }

    try {
      const displayHistoryToSave = this.chatHistory.slice(-50);
      localStorage.setItem(
        DISPLAY_HISTORY_KEY,
        JSON.stringify(displayHistoryToSave)
      );

      const systemMessage = this.apiMessages.find(
        (msg) => msg.role === "system"
      ) || {
        role: "system",
        content: this.systemPrompt,
      };

      const nonSystemMessages = this.apiMessages
        .filter((msg) => msg.role !== "system")
        .slice(-20);

      const apiHistoryToSave = [systemMessage, ...nonSystemMessages];
      localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(apiHistoryToSave));
    } catch (error) {
      console.error("Error saving chat memory in addMessage:", error);
    }
  }

  setApiMessages(messages: ApiMessage[]): void {
    const systemMessageIndex = messages.findIndex(
      (msg) => msg.role === "system"
    );
    if (systemMessageIndex >= 0) {
      messages[systemMessageIndex] = {
        role: "system",
        content: this.systemPrompt,
      };
    } else {
      messages = [{ role: "system", content: this.systemPrompt }, ...messages];
    }

    this.apiMessages = messages;

    const displayMessages: Message[] = messages
      .filter((msg) => msg.role !== "system")
      .map(
        (msg) =>
          ({
            text: msg.content,
            sender: msg.role === "user" ? "user" : "mentor",
            timestamp: new Date().toISOString(),
          } as Message)
      );

    if (
      this.chatHistory.length === 0 ||
      this.chatHistory.length < displayMessages.length
    ) {
      this.chatHistory = displayMessages;
    }

    try {
      localStorage.setItem(
        DISPLAY_HISTORY_KEY,
        JSON.stringify(this.chatHistory)
      );
      localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(this.apiMessages));
    } catch (error) {
      console.error("Error saving chat memory in setApiMessages:", error);
    }
  }

  checkForReminders(text: string): boolean {
    return this.reminderPhrases.some((phrase) =>
      text.toLowerCase().includes(phrase)
    );
  }

  clearHistory(): void {
    this.chatHistory = [];
    this.apiMessages = [{ role: "system", content: this.systemPrompt }];
    localStorage.removeItem(DISPLAY_HISTORY_KEY);
    localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(this.apiMessages));
  }

  resetSystemPrompt(): void {
    const systemMessageIndex = this.apiMessages.findIndex(
      (msg) => msg.role === "system"
    );
    if (systemMessageIndex >= 0) {
      this.apiMessages[systemMessageIndex] = {
        role: "system",
        content: this.systemPrompt,
      };
    } else {
      this.apiMessages = [
        { role: "system", content: this.systemPrompt },
        ...this.apiMessages,
      ];
    }
    localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(this.apiMessages));
  }

  removeLastMessage(): void {
    if (this.chatHistory.length > 0) {
      this.chatHistory.pop();
    }

    const nonSystemMessages = this.apiMessages.filter(
      (msg) => msg.role !== "system"
    );
    if (nonSystemMessages.length > 0) {
      const systemPrompt = this.apiMessages.find(
        (msg) => msg.role === "system"
      );
      const otherMessages = nonSystemMessages.slice(0, -1);

      this.apiMessages = systemPrompt
        ? [systemPrompt, ...otherMessages]
        : otherMessages;
    }

    this.saveChatMemory();
  }

  getJournalEntries(): JournalEntry[] {
    try {
      const savedEntries = localStorage.getItem(JOURNAL_ENTRIES_KEY);
      if (savedEntries) {
        return JSON.parse(savedEntries);
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
    return [];
  }

  saveJournalEntries(entries: JournalEntry[]): void {
    try {
      localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving journal entries:", error);
    }
  }

  addJournalEntry(
    content: string,
    source: "auto" | "manual" = "manual",
    messageId?: string
  ): JournalEntry {
    const now = new Date();
    const timestamp = now.getTime();

    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newEntry: JournalEntry = {
      id: timestamp,
      title: this.generateJournalTitle(content),
      content: content,
      date: dateStr,
      time: timeStr,
      timestamp: timestamp,
      source: source,
      messageId: messageId,
    };

    const entries = this.getJournalEntries();
    entries.push(newEntry);
    this.saveJournalEntries(entries);

    return newEntry;
  }

  private generateJournalTitle(content: string): string {
    const words = content.split(" ");
    let title = "";

    for (const word of words) {
      if ((title + " " + word).length <= 50) {
        title += (title ? " " : "") + word;
      } else {
        break;
      }
    }

    return title + (title.length < content.length ? "..." : "");
  }

  checkForJournalingContent(text: string): boolean {
    if (!text || text.length < 10) return false;

    const lowerText = text.toLowerCase().trim();

    const timeRegex =
      /\b(at|around|about|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|noon|midnight)?)\b/i;
    if (timeRegex.test(lowerText)) {
      return true;
    }

    const peopleRegex =
      /\b(dad|mom|father|mother|brother|sister|friend|spouse)\b/i;
    if (peopleRegex.test(lowerText)) {
      return true;
    }

    const eventRegex =
      /\b(went|arrived|visited|attended|meeting|appointment|lunch|party|event)\b/i;
    if (eventRegex.test(lowerText)) {
      return true;
    }

    const hasJournalTrigger = JOURNAL_TRIGGER_PHRASES.some((phrase) =>
      lowerText.includes(phrase.toLowerCase())
    );

    return hasJournalTrigger;
  }

  hasSimilarJournalEntry(content: string): boolean {
    const entries = this.getJournalEntries();
    const lowerContent = content.toLowerCase();

    for (const entry of entries) {
      const entryWords = new Set(entry.content.toLowerCase().split(/\s+/));
      const contentWords = lowerContent.split(/\s+/);

      let matchCount = 0;
      for (const word of contentWords) {
        if (entryWords.has(word)) {
          matchCount++;
        }
      }

      const similarityRatio = matchCount / contentWords.length;
      if (similarityRatio > 0.75) {
        return true;
      }
    }

    return false;
  }

  analyzeConversationForJournaling(
    userMessage: string,
    aiResponse: string
  ): void {
    const journalIndicators = [
      "noted in your journal",
      "added to your journal",
      "saved to your journal",
      "recorded in your journal",
      "i've noted",
      "i've recorded",
      "i've saved",
      "i've added this to your",
    ];

    const mapUpdateIndicators = [
      "added to your life map",
      "updated your life map",
      "added this to your finance",
      "added this to your health",
      "added this to your career",
      "added this to your relationships",
    ];

    const aiResponseIndicatesJournal = journalIndicators.some((indicator) =>
      aiResponse.toLowerCase().includes(indicator.toLowerCase())
    );

    const aiResponseIndicatesMapUpdate = mapUpdateIndicators.some((indicator) =>
      aiResponse.toLowerCase().includes(indicator.toLowerCase())
    );

    aiLifeMapConnector.analyzeConversation(userMessage, aiResponse);

    if (
      userMessage.toLowerCase().includes("fix my car") ||
      aiResponseIndicatesMapUpdate
    ) {
      const event = new CustomEvent("lifeMapUpdated", {
        detail: { trigger: "conversation", message: userMessage },
      });
      document.dispatchEvent(event);
    }

    if (
      aiResponseIndicatesJournal ||
      this.checkForJournalingContent(userMessage)
    ) {
      if (!this.hasSimilarJournalEntry(userMessage)) {
        const journalContent = this.extractJournalContent(userMessage);
        if (journalContent && journalContent.length > 5) {
          const messageId = `msg_${Date.now()}`;
          const entry = this.addJournalEntry(journalContent, "auto", messageId);
        }
      }
    }
  }

  private extractJournalContent(text: string): string {
    const plainText = text.replace(/<[^>]*>/g, "");

    const timeRegex =
      /\b(at|around|about|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|noon|midnight)?)\b/i;
    const timeMatch = plainText.match(timeRegex);

    if (timeMatch) {
      const sentences = plainText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const timeContextSentence = sentences.find((s) =>
        s.toLowerCase().includes(timeMatch[0].toLowerCase())
      );

      if (timeContextSentence) {
        return timeContextSentence.trim();
      }
    }

    const sentences = plainText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    if (sentences.length <= 1) {
      return plainText.trim();
    }

    const sentenceScores = sentences.map((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;

      for (const phrase of JOURNAL_TRIGGER_PHRASES) {
        if (lowerSentence.includes(phrase.toLowerCase())) {
          score += 1;
        }
      }

      if (timeRegex.test(lowerSentence)) score += 5;
      if (/\b(at|in|near|to)\s+\w+/i.test(lowerSentence)) score += 2;
      if (/\b(with|and)\s+\w+/i.test(lowerSentence)) score += 1;

      return { sentence, score };
    });

    sentenceScores.sort((a, b) => b.score - a.score);

    return sentenceScores[0].score === 0
      ? sentences[0].trim()
      : sentenceScores[0].sentence.trim();
  }

  checkAndHandleDayChange(): boolean {
    const LAST_DATE_CHECK_KEY = "lastDateCheck";
    const lastCheckedDate = localStorage.getItem(LAST_DATE_CHECK_KEY);

    const today = new Date().toISOString().split("T")[0];

    if (lastCheckedDate && lastCheckedDate !== today) {
      localStorage.setItem(LAST_DATE_CHECK_KEY, today);
      this.handleMidnightRollover(lastCheckedDate, today);
      return true;
    } else if (!lastCheckedDate) {
      localStorage.setItem(LAST_DATE_CHECK_KEY, today);
    }

    return false;
  }

  private handleMidnightRollover(previousDate: string, newDate: string): void {
    const dayChangeEvent = new CustomEvent("dayChanged", {
      detail: { previousDate, newDate },
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(dayChangeEvent);
    }
  }

  startVoiceRecognition(onResult: (text: string) => void): void {
    if (typeof window !== "undefined") {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        alert(
          "Your browser does not support voice recognition. Please try Chrome or Edge."
        );
        return;
      }

      const SpeechRecognitionAPI =
        window.webkitSpeechRecognition || window.SpeechRecognition;

      try {
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          alert("Error recognizing your voice. Please try again.");
        };

        recognition.start();
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
        alert("Error initializing voice recognition. Please try again.");
      }
    }
  }
}

const chatUtils = new ChatUtils();
export default chatUtils;
