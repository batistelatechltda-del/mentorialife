export interface Goal {
  id: string;
  title: string;
  emoji: string;
  type: "boolean" | "counter" | "input";
  completed: boolean;
  value?: number | string;
  target?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSection {
  id: string;
  title: string;
  goals: Goal[];
  createdAt: string;
  updatedAt: string;
}

const GOALS_STORAGE_KEY = "mentorAI_goals";


class GoalUtils {
  private goalSections: GoalSection[] = [];

  constructor() {
    this.loadGoals();
  }

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  loadGoals(): void {
    if (typeof window !== "undefined") {
      try {
        const storedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
        if (storedGoals) {
          this.goalSections = JSON.parse(storedGoals);
        } else {
          this.goalSections = this.getDefaultGoals();
          this.saveGoals();
        }
      } catch (error) {
        console.error("Error loading goals:", error);
        this.goalSections = this.getDefaultGoals();
        this.saveGoals();
      }
    }
  }

  saveGoals(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          GOALS_STORAGE_KEY,
          JSON.stringify(this.goalSections)
        );
      } catch (error) {
        console.error("Error saving goals:", error);
      }
    }
  }

  getGoalSections(): GoalSection[] {
    return this.goalSections;
  }

  private getDefaultGoals(): GoalSection[] {
    const now = new Date().toISOString();

    return [
      {
        id: this.generateId(),
        title: "Health",
        goals: [
          {
            id: this.generateId(),
            title: "Drink 6 bottles of water",
            emoji: "💧",
            type: "counter",
            completed: false,
            value: 0,
            target: 6,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: this.generateId(),
            title: "Go to the gym",
            emoji: "🏋️",
            type: "boolean",
            completed: false,
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.generateId(),
        title: "Personal Growth",
        goals: [
          {
            id: this.generateId(),
            title: "Say something you're grateful for",
            emoji: "💭",
            type: "input",
            completed: false,
            value: "",
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  createSection(title: string): GoalSection {
    const now = new Date().toISOString();

    const newSection: GoalSection = {
      id: this.generateId(),
      title,
      goals: [],
      createdAt: now,
      updatedAt: now,
    };

    this.goalSections.push(newSection);
    this.saveGoals();

    return newSection;
  }

  deleteSection(sectionId: string): boolean {
    const initialLength = this.goalSections.length;
    this.goalSections = this.goalSections.filter(
      (section) => section.id !== sectionId
    );

    if (this.goalSections.length !== initialLength) {
      this.saveGoals();
      return true;
    }

    return false;
  }

  addGoal(
    sectionId: string,
    title: string,
    emoji: string,
    type: "boolean" | "counter" | "input",
    target?: number
  ): Goal | null {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return null;
    }

    const now = new Date().toISOString();

    const newGoal: Goal = {
      id: this.generateId(),
      title,
      emoji,
      type,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    if (type === "counter") {
      newGoal.value = 0;
      newGoal.target = target || 1;
    } else if (type === "input") {
      newGoal.value = "";
    }

    this.goalSections[sectionIndex].goals.push(newGoal);
    this.goalSections[sectionIndex].updatedAt = now;
    this.saveGoals();

    return newGoal;
  }

  updateGoal(
    sectionId: string,
    goalId: string,
    updates: Partial<Goal>
  ): Goal | null {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return null;
    }

    const goalIndex = this.goalSections[sectionIndex].goals.findIndex(
      (goal) => goal.id === goalId
    );

    if (goalIndex === -1) {
      return null;
    }

    const now = new Date().toISOString();

    const updatedGoal = {
      ...this.goalSections[sectionIndex].goals[goalIndex],
      ...updates,
      updatedAt: now,
    };

    this.goalSections[sectionIndex].goals[goalIndex] = updatedGoal;
    this.goalSections[sectionIndex].updatedAt = now;
    this.saveGoals();

    return updatedGoal;
  }

  deleteGoal(sectionId: string, goalId: string): boolean {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return false;
    }

    const initialLength = this.goalSections[sectionIndex].goals.length;
    this.goalSections[sectionIndex].goals = this.goalSections[
      sectionIndex
    ].goals.filter((goal) => goal.id !== goalId);

    if (this.goalSections[sectionIndex].goals.length !== initialLength) {
      this.goalSections[sectionIndex].updatedAt = new Date().toISOString();
      this.saveGoals();
      return true;
    }

    return false;
  }

  completeGoal(sectionId: string, goalId: string): Goal | null {
    return this.updateGoal(sectionId, goalId, { completed: true });
  }

  uncompleteGoal(sectionId: string, goalId: string): Goal | null {
    return this.updateGoal(sectionId, goalId, { completed: false });
  }

  incrementGoal(sectionId: string, goalId: string): Goal | null {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return null;
    }

    const goalIndex = this.goalSections[sectionIndex].goals.findIndex(
      (goal) => goal.id === goalId
    );

    if (goalIndex === -1) {
      return null;
    }

    const goal = this.goalSections[sectionIndex].goals[goalIndex];

    if (goal.type !== "counter") {
      return null;
    }

    const currentValue = typeof goal.value === "number" ? goal.value : 0;
    const target = goal.target || 1;

    if (currentValue >= target) {
      return goal;
    }

    const newValue = currentValue + 1;
    const completed = newValue >= target;

    return this.updateGoal(sectionId, goalId, {
      value: newValue,
      completed,
    });
  }

  decrementGoal(sectionId: string, goalId: string): Goal | null {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return null;
    }

    const goalIndex = this.goalSections[sectionIndex].goals.findIndex(
      (goal) => goal.id === goalId
    );

    if (goalIndex === -1) {
      return null;
    }

    const goal = this.goalSections[sectionIndex].goals[goalIndex];

    if (goal.type !== "counter") {
      return null;
    }

    const currentValue = typeof goal.value === "number" ? goal.value : 0;

    if (currentValue <= 0) {
      return goal;
    }

    const newValue = currentValue - 1;
    const target = goal.target || 1;
    const completed = newValue >= target;

    return this.updateGoal(sectionId, goalId, {
      value: newValue,
      completed,
    });
  }

  setGoalInput(sectionId: string, goalId: string, value: string): Goal | null {
    const sectionIndex = this.goalSections.findIndex(
      (section) => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return null;
    }

    const goalIndex = this.goalSections[sectionIndex].goals.findIndex(
      (goal) => goal.id === goalId
    );

    if (goalIndex === -1) {
      return null;
    }

    const goal = this.goalSections[sectionIndex].goals[goalIndex];

    if (goal.type !== "input") {
      return null;
    }

    const completed = value.trim().length > 0;

    return this.updateGoal(sectionId, goalId, {
      value,
      completed,
    });
  }

  findSectionByTitle(title: string): GoalSection | null {
    const section = this.goalSections.find(
      (section) => section.title.toLowerCase() === title.toLowerCase()
    );

    return section || null;
  }

  findGoalByTitle(
    sectionTitle: string,
    goalTitle: string
  ): { section: GoalSection; goal: Goal } | null {
    const section = this.findSectionByTitle(sectionTitle);

    if (!section) {
      return null;
    }

    const goal = section.goals.find(
      (goal) => goal.title.toLowerCase() === goalTitle.toLowerCase()
    );

    if (!goal) {
      return null;
    }

    return { section, goal };
  }

  processGoalCommand(command: string): {
    success: boolean;
    message: string;
    action?: string;
  } {
    const lowerCommand = command.toLowerCase();

    if (
      lowerCommand.includes("create section") ||
      lowerCommand.includes("add section") ||
      lowerCommand.includes("created a new section") ||
      lowerCommand.includes("added a section")
    ) {
      const match = command.match(
        /(?:create|add|created|added) (?:a |new )?section (?:called|named)? ["']?([^"']+)["']?/i
      );

      if (match && match[1]) {
        const sectionTitle = match[1].trim();
        const existingSection = this.findSectionByTitle(sectionTitle);

        if (existingSection) {
          return {
            success: false,
            message: `A section named "${sectionTitle}" already exists.`,
            action: "create_section_failed_duplicate",
          };
        }

        this.createSection(sectionTitle);
        return {
          success: true,
          message: `Created a new section called "${sectionTitle}".`,
          action: "create_section_success",
        };
      }
    }

    if (
      lowerCommand.includes("add goal") ||
      lowerCommand.includes("create goal") ||
      lowerCommand.includes("added a goal")
    ) {
      const match =
        command.match(
          /(?:add|create|added) (?:a )?goal (?:to|in) (?:the )?["']?([^"']+)["']? section: ["']?([^"']+)["']?/i
        ) ||
        command.match(
          /(?:add|create|added) (?:a )?goal ["']?([^"']+)["']?(?: to| in)(?: the)? ["']?([^"']+)["']? section/i
        );

      if (match && match[1] && match[2]) {
        const sectionTitle = match[1].trim();
        const goalTitle = match[2].trim();

        const section = this.findSectionByTitle(sectionTitle);

        if (!section) {
          return {
            success: false,
            message: `Couldn't find a section named "${sectionTitle}".`,
            action: "add_goal_failed_no_section",
          };
        }

        let goalType: "boolean" | "counter" | "input" = "boolean";
        let emoji = "🎯";
        let target = undefined;

        if (
          goalTitle.match(
            /\b(\d+)\s*(times|reps|minutes|hours|days|weeks|bottles)\b/i
          )
        ) {
          goalType = "counter";
          const countMatch = goalTitle.match(
            /\b(\d+)\s*(times|reps|minutes|hours|days|weeks|bottles)\b/i
          );
          target = countMatch ? parseInt(countMatch[1], 10) : 1;

          if (
            goalTitle.toLowerCase().includes("water") ||
            goalTitle.toLowerCase().includes("drink")
          ) {
            emoji = "💧";
          } else if (
            goalTitle.toLowerCase().includes("read") ||
            goalTitle.toLowerCase().includes("book")
          ) {
            emoji = "📚";
          } else if (
            goalTitle.toLowerCase().includes("exercise") ||
            goalTitle.toLowerCase().includes("workout")
          ) {
            emoji = "🏋️";
          } else if (
            goalTitle.toLowerCase().includes("sleep") ||
            goalTitle.toLowerCase().includes("rest")
          ) {
            emoji = "😴";
          } else if (
            goalTitle.toLowerCase().includes("meditate") ||
            goalTitle.toLowerCase().includes("mindful")
          ) {
            emoji = "🧘";
          } else {
            emoji = "🔢";
          }
        }
        else if (
          goalTitle.toLowerCase().includes("write") ||
          goalTitle.toLowerCase().includes("journal") ||
          goalTitle.toLowerCase().includes("reflect") ||
          goalTitle.toLowerCase().includes("grateful")
        ) {
          goalType = "input";

          if (goalTitle.toLowerCase().includes("grateful")) {
            emoji = "🙏";
          } else if (goalTitle.toLowerCase().includes("journal")) {
            emoji = "📔";
          } else if (goalTitle.toLowerCase().includes("reflect")) {
            emoji = "💭";
          } else {
            emoji = "✏️";
          }
        }
        else {
          if (goalTitle.toLowerCase().includes("gym")) {
            emoji = "🏋️";
          } else if (goalTitle.toLowerCase().includes("meditate")) {
            emoji = "🧘";
          } else if (goalTitle.toLowerCase().includes("cook")) {
            emoji = "🍳";
          } else if (goalTitle.toLowerCase().includes("study")) {
            emoji = "📚";
          } else if (
            goalTitle.toLowerCase().includes("call") ||
            goalTitle.toLowerCase().includes("talk")
          ) {
            emoji = "📞";
          } else if (goalTitle.toLowerCase().includes("clean")) {
            emoji = "🧹";
          } else {
            emoji = "🎯";
          }
        }

        this.addGoal(section.id, goalTitle, emoji, goalType, target);

        return {
          success: true,
          message: `Added a new ${goalType} goal "${goalTitle}" to the "${sectionTitle}" section.`,
          action: "add_goal_success",
        };
      }
    }

    if (
      lowerCommand.includes("complete goal") ||
      lowerCommand.includes("mark goal") ||
      lowerCommand.includes("finished goal") ||
      lowerCommand.includes("goal completed")
    ) {
      const match =
        command.match(
          /(?:complete|mark|finished)(?: goal)? ["']?([^"']+)["']?(?: in| from)? (?:the )?["']?([^"']+)["']? section/i
        ) ||
        command.match(
          /["']?([^"']+)["']?(?: goal)? (?:in|from) (?:the )?["']?([^"']+)["']? section (?:is )?completed/i
        );

      if (match && match[1] && match[2]) {
        const goalTitle = match[1].trim();
        const sectionTitle = match[2].trim();

        const result = this.findGoalByTitle(sectionTitle, goalTitle);

        if (!result) {
          return {
            success: false,
            message: `Couldn't find a goal named "${goalTitle}" in the "${sectionTitle}" section.`,
            action: "complete_goal_failed_not_found",
          };
        }

        this.completeGoal(result.section.id, result.goal.id);

        return {
          success: true,
          message: `Marked the goal "${goalTitle}" as complete in the "${sectionTitle}" section.`,
          action: "complete_goal_success",
        };
      }
    }

    if (
      lowerCommand.includes("increment") ||
      lowerCommand.includes("add to") ||
      lowerCommand.includes("increase")
    ) {
      const match = command.match(
        /(?:increment|add to|increase)(?: the)? ["']?([^"']+)["']?(?: goal)?(?: in| from)? (?:the )?["']?([^"']+)["']? section/i
      );

      if (match && match[1] && match[2]) {
        const goalTitle = match[1].trim();
        const sectionTitle = match[2].trim();

        const result = this.findGoalByTitle(sectionTitle, goalTitle);

        if (!result) {
          return {
            success: false,
            message: `Couldn't find a goal named "${goalTitle}" in the "${sectionTitle}" section.`,
            action: "increment_goal_failed_not_found",
          };
        }

        if (result.goal.type !== "counter") {
          return {
            success: false,
            message: `The goal "${goalTitle}" is not a counter goal. It cannot be incremented.`,
            action: "increment_goal_failed_wrong_type",
          };
        }

        this.incrementGoal(result.section.id, result.goal.id);

        const currentValue =
          typeof result.goal.value === "number" ? result.goal.value + 1 : 1;
        const target = result.goal.target || 1;

        return {
          success: true,
          message: `Incremented the goal "${goalTitle}" to ${currentValue}/${target}.`,
          action: "increment_goal_success",
        };
      }
    }

    if (
      lowerCommand.includes("set input") ||
      lowerCommand.includes("write in") ||
      lowerCommand.includes("answer")
    ) {
      const match = command.match(
        /(?:set input|write in|answer)(?: for)?(?: the)? ["']?([^"']+)["']?(?: goal)?(?: in| from)? (?:the )?["']?([^"']+)["']? section(?: to| as)? ["']?([^"']+)["']?/i
      );

      if (match && match[1] && match[2] && match[3]) {
        const goalTitle = match[1].trim();
        const sectionTitle = match[2].trim();
        const inputValue = match[3].trim();

        const result = this.findGoalByTitle(sectionTitle, goalTitle);

        if (!result) {
          return {
            success: false,
            message: `Couldn't find a goal named "${goalTitle}" in the "${sectionTitle}" section.`,
            action: "set_input_goal_failed_not_found",
          };
        }

        if (result.goal.type !== "input") {
          return {
            success: false,
            message: `The goal "${goalTitle}" is not an input goal. It cannot have text input set.`,
            action: "set_input_goal_failed_wrong_type",
          };
        }

        this.setGoalInput(result.section.id, result.goal.id, inputValue);

        return {
          success: true,
          message: `Set input for goal "${goalTitle}" to "${inputValue}".`,
          action: "set_input_goal_success",
        };
      }
    }

    return this.detectGoalProgress(command);
  }

  detectGoalProgress(statement: string): {
    success: boolean;
    message: string;
    action?: string;
  } {
    const lowerStatement = statement.toLowerCase();

    const hasWater =
      lowerStatement.includes("water") ||
      lowerStatement.includes("drink") ||
      lowerStatement.includes("hydration") ||
      lowerStatement.includes("bottle");

    const hasExercise =
      lowerStatement.includes("exercise") ||
      lowerStatement.includes("workout") ||
      lowerStatement.includes("gym") ||
      lowerStatement.includes("training") ||
      lowerStatement.includes("ran") ||
      lowerStatement.includes("jog") ||
      lowerStatement.includes("walk");

    const hasReading =
      lowerStatement.includes("read") ||
      lowerStatement.includes("book") ||
      lowerStatement.includes("page") ||
      lowerStatement.includes("chapter");

    const hasMeditation =
      lowerStatement.includes("meditate") ||
      lowerStatement.includes("meditation") ||
      lowerStatement.includes("mindful");

    const hasSteps =
      lowerStatement.includes("step") || lowerStatement.includes("walk");

    const hasWork =
      lowerStatement.includes("work") ||
      lowerStatement.includes("worked") ||
      lowerStatement.includes("did some") ||
      lowerStatement.includes("spent time") ||
      lowerStatement.includes("focused on");

    const hasTimeUnits =
      lowerStatement.includes("minute") ||
      lowerStatement.includes("hour") ||
      lowerStatement.includes("session");

    const allSectionTitles = this.goalSections.map((section) =>
      section.title.toLowerCase()
    );
    const mentionedSections = allSectionTitles.filter((title) =>
      lowerStatement.includes(title.toLowerCase())
    );

    const completedIndicators = [
      "finished",
      "completed",
      "done",
      "did",
      "just",
      "today",
      "had",
      "took",
    ];
    const hasCompleted = completedIndicators.some((indicator) =>
      lowerStatement.includes(indicator)
    );

    const numberWords = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
    ];
    const numberTerms = [
      ...numberWords,
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ];

    let numbers: number[] = [];

    const digitMatches = lowerStatement.match(/\d+/g);
    if (digitMatches) {
      numbers = numbers.concat(digitMatches.map((n) => parseInt(n, 10)));
    }

    numberWords.forEach((word, index) => {
      if (lowerStatement.includes(word)) {
        numbers.push(index + 1);
      }
    });

    if (numbers.length === 0 && hasCompleted) {
      numbers.push(1);
    }

    const sections = this.getGoalSections();

    if (hasWater && hasCompleted) {
      for (const section of sections) {
        const waterGoals = section.goals.filter(
          (goal) =>
            goal.type === "counter" &&
            (goal.title.toLowerCase().includes("water") ||
              goal.title.toLowerCase().includes("drink") ||
              goal.title.toLowerCase().includes("bottle"))
        );

        if (waterGoals.length > 0) {
          const goal = waterGoals[0]; 

          const count = numbers.length > 0 ? numbers[0] : 1;

          for (let i = 0; i < count; i++) {
            this.incrementGoal(section.id, goal.id);
          }

          const currentValue =
            typeof goal.value === "number" ? goal.value + count : count;
          const target = goal.target || 1;

          return {
            success: true,
            message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
            action: "increment_goal_auto",
          };
        }
      }
    }

    if (hasExercise && hasCompleted) {
      for (const section of sections) {
        const exerciseGoals = section.goals.filter(
          (goal) =>
            goal.title.toLowerCase().includes("exercise") ||
            goal.title.toLowerCase().includes("workout") ||
            goal.title.toLowerCase().includes("gym") ||
            goal.title.toLowerCase().includes("training")
        );

        if (exerciseGoals.length > 0) {
          const goal = exerciseGoals[0]; 

          if (goal.type === "counter") {
            const count = numbers.length > 0 ? numbers[0] : 1;

            for (let i = 0; i < count; i++) {
              this.incrementGoal(section.id, goal.id);
            }

            const currentValue =
              typeof goal.value === "number" ? goal.value + count : count;
            const target = goal.target || 1;

            return {
              success: true,
              message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
              action: "increment_goal_auto",
            };
          } else if (goal.type === "boolean") {
            this.completeGoal(section.id, goal.id);

            return {
              success: true,
              message: `Marked the "${goal.title}" as complete in the ${section.title} section.`,
              action: "complete_goal_auto",
            };
          }
        }
      }
    }

    if (hasReading && hasCompleted) {
      for (const section of sections) {
        const readingGoals = section.goals.filter(
          (goal) =>
            goal.title.toLowerCase().includes("read") ||
            goal.title.toLowerCase().includes("book") ||
            goal.title.toLowerCase().includes("page")
        );

        if (readingGoals.length > 0) {
          const goal = readingGoals[0]; 

          if (goal.type === "counter") {
            const count = numbers.length > 0 ? numbers[0] : 1;

            for (let i = 0; i < count; i++) {
              this.incrementGoal(section.id, goal.id);
            }

            const currentValue =
              typeof goal.value === "number" ? goal.value + count : count;
            const target = goal.target || 1;

            return {
              success: true,
              message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
              action: "increment_goal_auto",
            };
          } else if (goal.type === "boolean") {
            this.completeGoal(section.id, goal.id);

            return {
              success: true,
              message: `Marked the "${goal.title}" as complete in the ${section.title} section.`,
              action: "complete_goal_auto",
            };
          }
        }
      }
    }

    if (hasMeditation && hasCompleted) {
      for (const section of sections) {
        const meditationGoals = section.goals.filter(
          (goal) =>
            goal.title.toLowerCase().includes("meditate") ||
            goal.title.toLowerCase().includes("meditation") ||
            goal.title.toLowerCase().includes("mindful")
        );

        if (meditationGoals.length > 0) {
          const goal = meditationGoals[0]; 

          if (goal.type === "counter") {
            const count = numbers.length > 0 ? numbers[0] : 1;

            for (let i = 0; i < count; i++) {
              this.incrementGoal(section.id, goal.id);
            }

            const currentValue =
              typeof goal.value === "number" ? goal.value + count : count;
            const target = goal.target || 1;

            return {
              success: true,
              message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
              action: "increment_goal_auto",
            };
          } else if (goal.type === "boolean") {
            this.completeGoal(section.id, goal.id);

            return {
              success: true,
              message: `Marked the "${goal.title}" as complete in the ${section.title} section.`,
              action: "complete_goal_auto",
            };
          }
        }
      }
    }

    if (hasSteps && numbers.length > 0) {
      for (const section of sections) {
        const stepGoals = section.goals.filter(
          (goal) =>
            goal.title.toLowerCase().includes("step") ||
            goal.title.toLowerCase().includes("walk")
        );

        if (stepGoals.length > 0) {
          const goal = stepGoals[0]; 

          if (goal.type === "counter") {
            const count = numbers[0];
            const target = goal.target || 1;

            const currentValue =
              typeof goal.value === "number" ? goal.value : 0;

            if (count > currentValue) {
              this.updateGoal(section.id, goal.id, {
                value: count,
                completed: count >= target,
              });

              return {
                success: true,
                message: `Updated the "${goal.title}" to ${count}/${target} in the ${section.title} section.`,
                action: "update_goal_auto",
              };
            }
          }
        }
      }
    }

    if (
      hasWork &&
      hasCompleted &&
      (hasTimeUnits || numbers.length > 0) &&
      mentionedSections.length > 0
    ) {
      for (const sectionTitle of mentionedSections) {
        const section = sections.find(
          (s) => s.title.toLowerCase() === sectionTitle
        );

        if (section) {
          const timeBasedGoals = section.goals.filter(
            (goal) =>
              goal.type === "counter" &&
              (goal.title.toLowerCase().includes("minute") ||
                goal.title.toLowerCase().includes("hour") ||
                goal.title.toLowerCase().includes("work") ||
                goal.title.toLowerCase().includes("time"))
          );

          if (timeBasedGoals.length > 0) {
            const goal = timeBasedGoals[0]; 

            const timeAmount = numbers.length > 0 ? numbers[0] : 1;

            for (let i = 0; i < timeAmount; i++) {
              this.incrementGoal(section.id, goal.id);
            }

            const currentValue =
              typeof goal.value === "number"
                ? goal.value + timeAmount
                : timeAmount;
            const target = goal.target || 1;

            return {
              success: true,
              message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
              action: "increment_project_time_goal",
            };
          } else {
           
            if (section.goals.length > 0) {
              const goal = section.goals[0]; 

              if (goal.type === "counter") {
                this.incrementGoal(section.id, goal.id);

                const currentValue =
                  typeof goal.value === "number" ? goal.value + 1 : 1;
                const target = goal.target || 1;

                return {
                  success: true,
                  message: `Incremented the "${goal.title}" to ${currentValue}/${target} in the ${section.title} section.`,
                  action: "increment_project_goal",
                };
              } else if (goal.type === "boolean") {
                this.completeGoal(section.id, goal.id);

                return {
                  success: true,
                  message: `Marked the "${goal.title}" as complete in the ${section.title} section.`,
                  action: "complete_project_goal",
                };
              }
            }
          }
        }
      }
    }

    return {
      success: false,
      message: "No matching goals found for the action described.",
      action: "no_matching_goals",
    };
  }

  getGoalStats(): {
    totalSections: number;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
  } {
    let totalGoals = 0;
    let completedGoals = 0;

    this.goalSections.forEach((section) => {
      totalGoals += section.goals.length;
      completedGoals += section.goals.filter((goal) => goal.completed).length;
    });

    const completionRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return {
      totalSections: this.goalSections.length,
      totalGoals,
      completedGoals,
      completionRate,
    };
  }
}

const goalUtils: any = new GoalUtils();
export default goalUtils;
