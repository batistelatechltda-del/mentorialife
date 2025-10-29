import { v4 as uuidv4 } from "uuid";

export interface TreeNode {
  id: string;
  name: string;
  type: "root" | "area" | "item" | "dependent-item";
  color: string;
  progress?: number;
  target?: number;
  children: TreeNode[];
  status?: "completed" | "in-progress" | "not-started";
  details?: string;
  note?: string;
  dependsOn?: string; 
  createdAt: string; 
}

export interface LifeArea {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  active: boolean;
}

export const COLORS = {
  ROOT: "#00F3FF",
  FINANCE: "#00E1B4",
  HEALTH: "#00CD9A",
  CAREER: "#00B98E",
  RELATIONSHIPS: "#00A68D",
  PERSONAL_GROWTH: "#00928B",
  SPIRITUALITY: "#007F8C",
  RECREATION: "#006D8D",
  COMPLETED: "#00FF85",
  IN_PROGRESS: "#FFD600",
  NOT_STARTED: "#FF5C8D",
};

export const DEFAULT_NOTES: Record<string, string> = {
  root: "This is your Life Map. It shows how different areas of your life connect and what you're working on.",
  finance: "Track your financial goals and progress here.",
  health: "Monitor your health-related activities and goals.",
  career: "Plan your career development and track professional goals.",
  relationships: "Nurture your connections with others.",
  "personal-growth": "Work on your personal development and skills.",
  spirituality: "Explore your spiritual health and mindfulness.",
  recreation: "Make time for hobbies and activities you enjoy.",
};

export const ALL_LIFE_AREAS: LifeArea[] = [
  {
    id: "finance",
    name: "Finance",
    color: COLORS.FINANCE,
    description: "Money management, saving, investing, and financial goals",
    active: true, 
  },
  {
    id: "health",
    name: "Health",
    color: COLORS.HEALTH,
    description: "Physical fitness, nutrition, sleep, and overall wellbeing",
    active: true, 
  },
  {
    id: "career",
    name: "Career",
    color: COLORS.CAREER,
    description: "Professional development, work satisfaction, and growth",
    active: false, 
  },
  {
    id: "relationships",
    name: "Relationships",
    color: COLORS.RELATIONSHIPS,
    description: "Family, friends, romantic partners, and social connections",
    active: false, 
  },
  {
    id: "personal-growth",
    name: "Personal Growth",
    color: COLORS.PERSONAL_GROWTH,
    description: "Learning, skills, knowledge expansion, and self-improvement",
    active: false,
  },
  {
    id: "spirituality",
    name: "Spirituality",
    color: COLORS.SPIRITUALITY,
    description:
      "Inner peace, values, meaning, and connection to something greater",
    active: false,
  },
  {
    id: "recreation",
    name: "Recreation",
    color: COLORS.RECREATION,
    description: "Hobbies, entertainment, leisure, and fun activities",
    active: false,
  },
];

export const AREA_KEYWORDS: Record<string, string[]> = {
  finance: [
    "money",
    "budget",
    "save",
    "invest",
    "spend",
    "finance",
    "financial",
    "bill",
    "bills",
    "debt",
    "mortgage",
    "rent",
    "loan",
    "loans",
    "expense",
    "expenses",
    "payment",
    "payments",
    "salary",
    "income",
    "car",
    "fix",
    "repair",
    "sell",
  ],
  health: [
    "health",
    "fitness",
    "exercise",
    "gym",
    "workout",
    "run",
    "running",
    "jog",
    "jogging",
    "yoga",
    "diet",
    "nutrition",
    "food",
    "eat",
    "eating",
    "weight",
    "sleep",
    "rest",
    "doctor",
    "medical",
    "medicine",
    "mental health",
    "therapy",
    "hydrate",
    "hydration",
    "water",
  ],
  career: [
    "job",
    "work",
    "career",
    "profession",
    "business",
    "company",
    "interview",
    "resume",
    "cv",
    "promotion",
    "raise",
    "boss",
    "colleague",
    "project",
    "client",
    "meeting",
    "deadline",
    "email",
    "skill",
    "skills",
    "professional",
  ],
  relationships: [
    "friend",
    "family",
    "partner",
    "spouse",
    "husband",
    "wife",
    "boyfriend",
    "girlfriend",
    "date",
    "dating",
    "relationship",
    "social",
    "connection",
    "people",
    "person",
    "talk",
    "communicate",
    "communication",
    "conflict",
    "argument",
    "fight",
    "love",
    "trust",
    "respect",
  ],
  "personal-growth": [
    "learn",
    "study",
    "read",
    "book",
    "course",
    "class",
    "workshop",
    "skill",
    "knowledge",
    "growth",
    "develop",
    "improve",
    "goal",
    "challenge",
    "mindset",
    "habit",
    "journal",
    "reflect",
    "reflection",
    "personal development",
  ],
  spirituality: [
    "spirit",
    "spiritual",
    "meditate",
    "meditation",
    "mindful",
    "mindfulness",
    "yoga",
    "belief",
    "faith",
    "religion",
    "religious",
    "pray",
    "prayer",
    "soul",
    "meaning",
    "purpose",
    "value",
    "values",
    "ethics",
    "moral",
    "gratitude",
    "thankful",
  ],
  recreation: [
    "hobby",
    "hobbies",
    "fun",
    "play",
    "enjoy",
    "entertain",
    "entertainment",
    "game",
    "games",
    "movie",
    "tv",
    "television",
    "music",
    "art",
    "craft",
    "travel",
    "vacation",
    "trip",
    "adventure",
    "sport",
    "sports",
    "leisure",
    "relax",
    "relaxation",
  ],
};

class LifeMapUtils {
  private tree: TreeNode;
  private userName: string;
  private activeAreas: LifeArea[];
  private itemsById: Map<string, { node: TreeNode; parentId: string }>;
  private hasInitialized: boolean = false;

  constructor() {
    this.userName =
      (typeof window !== "undefined" &&
        window?.localStorage &&
        localStorage.getItem("userName")) ||
      "User";

    this.activeAreas = ALL_LIFE_AREAS.filter((area) => area.active);

    this.tree = {
      id: "root",
      name: this.userName,
      type: "root",
      color: COLORS.ROOT,
      children: [],
      note: DEFAULT_NOTES["root"],
      createdAt: new Date().toISOString(),
    };

    this.itemsById = new Map();

    this.initializeBaseAreas();

    this.loadMapData();
  }

  private initializeBaseAreas(): void {
    if (this.tree.children.length === 0) {
      this.activeAreas.forEach((area) => {
        const areaNode: TreeNode = {
          id: area.id,
          name: area.name,
          type: "area",
          color: area.color,
          children: [],
          note: DEFAULT_NOTES[area.id] || `Explore your ${area.name} area`,
          createdAt: new Date().toISOString(),
        };
        this.tree.children.push(areaNode);
        this.itemsById.set(areaNode.id, { node: areaNode, parentId: "root" });
      });
    }
  }

  loadMapData(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const savedMapData = localStorage.getItem("lifeMapData");
        if (savedMapData) {
          const parsedData = JSON.parse(savedMapData);

          if (parsedData.tree) {
            this.tree = parsedData.tree;

            this.tree.name = this.userName;
          }

          if (parsedData.activeAreas) {
            this.activeAreas = parsedData.activeAreas;
          }

          this.rebuildItemsMap();

          this.hasInitialized = true;
        }
      } catch (error) {
        console.error("Error loading life map data:", error);
        this.initializeBaseAreas();
      }
    }
  }

  saveMapData(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const mapData = {
          tree: this.tree,
          activeAreas: this.activeAreas,
        };

        localStorage.setItem("lifeMapData", JSON.stringify(mapData));
      } catch (error) {
        console.error("Error saving life map data:", error);
      }
    }
  }

  private rebuildItemsMap(): void {
    this.itemsById.clear();

    this.itemsById.set(this.tree.id, { node: this.tree, parentId: "" });

    const addNodesRecursively = (node: TreeNode, parentId: string) => {
      node.children.forEach((child) => {
        this.itemsById.set(child.id, { node: child, parentId });
        addNodesRecursively(child, child.id);
      });
    };

    addNodesRecursively(this.tree, this.tree.id);
  }

  getTree(): TreeNode {
    return this.tree;
  }

  activateLifeArea(areaId: string): boolean {
    const areaToActivate = ALL_LIFE_AREAS.find((area) => area.id === areaId);
    if (!areaToActivate) {
      return false;
    }

    if (this.activeAreas.some((area) => area.id === areaId)) {
      return true; 
    }

    areaToActivate.active = true;
    this.activeAreas.push(areaToActivate);

    const areaNode: TreeNode = {
      id: areaToActivate.id,
      name: areaToActivate.name,
      type: "area",
      color: areaToActivate.color,
      children: [],
      note:
        DEFAULT_NOTES[areaToActivate.id] ||
        `Explore your ${areaToActivate.name} area`,
      createdAt: new Date().toISOString(),
    };

    this.tree.children.push(areaNode);
    this.itemsById.set(areaNode.id, { node: areaNode, parentId: "root" });

    this.saveMapData();

    this.dispatchUpdateEvent();

    return true;
  }

  addItem(
    areaId: string,
    name: string,
    details?: string,
    note?: string,
    progress?: number,
    target?: number,
    dependsOnId?: string
  ): string | null {
    const areaNode = this.itemsById.get(areaId)?.node;
    if (!areaNode || areaNode.type !== "area") {
      return null;
    }

    const itemId = uuidv4();

    const type = dependsOnId ? "dependent-item" : "item";
    let status: "completed" | "in-progress" | "not-started" = "not-started";

    if (progress !== undefined && target !== undefined) {
      if (progress >= target) {
        status = "completed";
      } else if (progress > 0) {
        status = "in-progress";
      }
    } else if (progress !== undefined && progress > 0) {
      status = "in-progress";
    }

    let color = COLORS.NOT_STARTED;
    if (status === "completed") {
      color = COLORS.COMPLETED;
    } else if (status === "in-progress") {
      color = COLORS.IN_PROGRESS;
    }

    const newItem: TreeNode = {
      id: itemId,
      name: name,
      type,
      color,
      children: [],
      status,
      details: details || `Added on ${new Date().toLocaleDateString()}`,
      note: note || `Take action on this ${areaNode.name.toLowerCase()} task.`,
      createdAt: new Date().toISOString(),
    };

    if (progress !== undefined) {
      newItem.progress = progress;
    }

    if (target !== undefined) {
      newItem.target = target;
    }

    if (dependsOnId) {
      newItem.dependsOn = dependsOnId;
    }

    areaNode.children.push(newItem);
    this.itemsById.set(itemId, { node: newItem, parentId: areaId });

    this.saveMapData();

    this.dispatchUpdateEvent();

    return itemId;
  }

  updateItem(
    itemId: string,
    updates: {
      name?: string;
      details?: string;
      note?: string;
      progress?: number;
      target?: number;
      status?: "completed" | "in-progress" | "not-started";
    }
  ): boolean {
    const itemInfo = this.itemsById.get(itemId);
    if (
      !itemInfo ||
      (itemInfo.node.type !== "item" && itemInfo.node.type !== "dependent-item")
    ) {
      return false;
    }

    const { node } = itemInfo;

    if (updates.name) {
      node.name = updates.name;
    }

    if (updates.details) {
      node.details = updates.details;
    }

    if (updates.note) {
      node.note = updates.note;
    }

    if (updates.progress !== undefined) {
      node.progress = updates.progress;
    }

    if (updates.target !== undefined) {
      node.target = updates.target;
    }

    if (updates.status) {
      node.status = updates.status;

      if (updates.status === "completed") {
        node.color = COLORS.COMPLETED;
      } else if (updates.status === "in-progress") {
        node.color = COLORS.IN_PROGRESS;
      } else {
        node.color = COLORS.NOT_STARTED;
      }
    }
    else if (
      (updates.progress !== undefined || updates.target !== undefined) &&
      node.progress !== undefined &&
      node.target !== undefined
    ) {
      if (node.progress >= node.target) {
        node.status = "completed";
        node.color = COLORS.COMPLETED;
      } else if (node.progress > 0) {
        node.status = "in-progress";
        node.color = COLORS.IN_PROGRESS;
      } else {
        node.status = "not-started";
        node.color = COLORS.NOT_STARTED;
      }
    }

    this.saveMapData();

    this.dispatchUpdateEvent();

    return true;
  }

  canAddDependentItem(itemId: string): boolean {
    const itemInfo = this.itemsById.get(itemId);
    return !!(
      itemInfo &&
      (itemInfo.node.type === "item" || itemInfo.node.type === "dependent-item")
    );
  }

  addDependentItem(
    areaId: string,
    name: string,
    details?: string,
    note?: string,
    progress: number = 0,
    target?: number,
    parentItemId?: string
  ): string | null {
    if (parentItemId) {
      const itemInfo = this.itemsById.get(parentItemId);
      if (
        !itemInfo ||
        (itemInfo.node.type !== "item" &&
          itemInfo.node.type !== "dependent-item")
      ) {
        return null;
      }

      if (!areaId) {
        areaId = itemInfo.parentId;
      }
    }

    if (!areaId) {
      return null;
    }

    return this.addItem(
      areaId,
      name,
      details,
      note,
      progress, 
      target, 
      parentItemId 
    );
  }

  getDependentItems(itemId: string): TreeNode[] {
    const dependentItems: TreeNode[] = [];

    for (const [id, info] of this.itemsById.entries()) {
      if (info.node.dependsOn === itemId) {
        dependentItems.push(info.node);
      }
    }

    return dependentItems;
  }

  getNodeById(id: string): TreeNode | null {
    return this.itemsById.get(id)?.node || null;
  }

  deleteItem(itemId: string): boolean {
    const itemInfo = this.itemsById.get(itemId);
    if (
      !itemInfo ||
      (itemInfo.node.type !== "item" && itemInfo.node.type !== "dependent-item")
    ) {
      return false;
    }

    const parentInfo = this.itemsById.get(itemInfo.parentId);
    if (!parentInfo) {
      return false;
    }

    const dependentItems = this.getDependentItems(itemId);
    if (dependentItems.length > 0) {
      return false;
    }

    const childIndex = parentInfo.node.children.findIndex(
      (child) => child.id === itemId
    );
    if (childIndex === -1) {
      return false;
    }

    parentInfo.node.children.splice(childIndex, 1);

    this.itemsById.delete(itemId);

    this.saveMapData();

    this.dispatchUpdateEvent();

    return true;
  }

  getActiveAreas(): LifeArea[] {
    return [...this.activeAreas];
  }

  getAllAreas(): LifeArea[] {
    return [...ALL_LIFE_AREAS];
  }

  updateUserName(name: string): void {
    this.userName = name;
    this.tree.name = name;
    localStorage.setItem("userName", name);
    this.saveMapData();
    this.dispatchUpdateEvent();
  }

  itemExistsInArea(areaId: string, itemName: string): boolean {
    const areaNode = this.itemsById.get(areaId)?.node;
    if (!areaNode || areaNode.type !== "area") {
      return false;
    }

    const normalizedName = itemName.toLowerCase().trim();
    return areaNode.children.some(
      (item) => item.name.toLowerCase().trim() === normalizedName
    );
  }

  findItems(searchTerm: string): { item: TreeNode; areaId: string }[] {
    const results: { item: TreeNode; areaId: string }[] = [];
    const normalizedTerm = searchTerm.toLowerCase().trim();

    for (const [id, info] of this.itemsById.entries()) {
      const { node, parentId } = info;

      if (node.type === "item" || node.type === "dependent-item") {
        if (
          node.name.toLowerCase().includes(normalizedTerm) ||
          (node.details && node.details.toLowerCase().includes(normalizedTerm))
        ) {
          let currentParentId = parentId;
          while (currentParentId) {
            const parentNode = this.itemsById.get(currentParentId);
            if (!parentNode) break;

            if (parentNode.node.type === "area") {
              results.push({ item: node, areaId: parentNode.node.id });
              break;
            }

            currentParentId = parentNode.parentId;
          }
        }
      }
    }

    return results;
  }

  getMapSummary(): string {
    let summary = `Life Areas Map Summary:\n\n`;

    summary += `Active Life Areas: ${this.activeAreas
      .map((area) => area.name)
      .join(", ")}\n\n`;

    this.tree.children.forEach((areaNode) => {
      if (areaNode.type === "area") {
        summary += `${areaNode.name} Area:\n`;

        if (areaNode.children.length === 0) {
          summary += `- No items yet\n`;
        } else {
          areaNode.children.forEach((item) => {
            let itemSummary = `- ${item.name}`;

            if (item.progress !== undefined && item.target !== undefined) {
              itemSummary += ` (${item.progress}/${item.target})`;
            }

            itemSummary += ` [${item.status}]`;

            if (item.dependsOn) {
              const dependsOnNode = this.itemsById.get(item.dependsOn)?.node;
              if (dependsOnNode) {
                itemSummary += ` (depends on: ${dependsOnNode.name})`;
              }
            }

            summary += `${itemSummary}\n`;
          });
        }

        summary += `\n`;
      }
    });

    return summary;
  }

  resetMap(): void {
    this.activeAreas = ALL_LIFE_AREAS.filter(
      (area) => area.id === "finance" || area.id === "health"
    );

    ALL_LIFE_AREAS.forEach((area) => {
      if (area.id !== "finance" && area.id !== "health") {
        area.active = false;
      }
    });

    this.tree = {
      id: "root",
      name: this.userName,
      type: "root",
      color: COLORS.ROOT,
      children: [],
      note: DEFAULT_NOTES["root"],
      createdAt: new Date().toISOString(),
    };

    this.itemsById.clear();
    this.itemsById.set("root", { node: this.tree, parentId: "" });

    this.initializeBaseAreas();

    this.saveMapData();

    this.dispatchUpdateEvent();
  }

  private dispatchUpdateEvent(): void {
    const event = new CustomEvent("lifeMapUpdated", {
      detail: { tree: this.tree },
    });
    document.dispatchEvent(event);
  }

  suggestAreaForTopic(topic: string): string | null {
    const normalizedTopic = topic.toLowerCase().trim();

    for (const [areaId, keywords] of Object.entries(AREA_KEYWORDS)) {
      if (keywords.some((keyword) => normalizedTopic.includes(keyword))) {
        return areaId;
      }
    }

    return null; 
  }

  detectProgressMention(text: string): {
    progress: number;
    target?: number;
    topicName: string;
  } | null {

    const progressPattern =
      /(\$?\d+(?:\.\d+)?)\s+(?:out\s+of|of)\s+(\$?\d+(?:\.\d+)?)\s+(.+?)(?:\.|\,|\!|\?|$)/i;
    const match = text.match(progressPattern);

    if (match) {
      let progress = parseFloat(match[1].replace("$", ""));
      let target = parseFloat(match[2].replace("$", ""));
      let topicName = match[3].trim();

      if (topicName.length > 50) {
        topicName = topicName.substring(0, 47) + "...";
      }

      return { progress, target, topicName };
    }

    const simpleCountPattern =
      /(\d+)\s+(.+?)(?:\s+today|\s+this\s+week|\s+this\s+month|\.|\,|\!|\?|$)/i;
    const simpleMatch = text.match(simpleCountPattern);

    if (simpleMatch) {
      let progress = parseFloat(simpleMatch[1]);
      let topicName = simpleMatch[2].trim();

      if (topicName.length > 50) {
        topicName = topicName.substring(0, 47) + "...";
      }

      return { progress, topicName };
    }

    return null;
  }
}

export const lifeMapUtils = new LifeMapUtils();

export default lifeMapUtils;
