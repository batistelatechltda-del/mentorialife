import OpenAI from 'openai';
import lifeMapUtils, { TreeNode } from './lifeMapUtils';


const FINANCE_ITEM_CATEGORIES = {
  RENT: "Pay Rent",
  BILLS: "Pay Bills",
  CAR_FIX: "Fix My Car",
  CAR_SELL: "Sell My Car",
  CAR_PAYMENT: "Car Payment",
  GROCERY: "Grocery Budget",
  EMERGENCY: "Emergency Fund",
  TRAVEL: "Travel Fund",
  SAVINGS: "General Savings",
  DEBT: "Pay Off Debt",
  INVESTMENT: "Investment Fund"
};

const HEALTH_ITEM_CATEGORIES = {
  FITNESS: "Fitness Goals",
  NUTRITION: "Healthy Eating",
  HYDRATION: "Daily Hydration",
  SLEEP: "Sleep Schedule",
  MENTAL: "Mental Wellness"
};

const DEFAULT_TARGETS = {
  RENT: 2030,
  BILLS: 500,
  CAR_FIX: 500,
  CAR_PAYMENT: 400,
  GROCERY: 400,
  EMERGENCY: 5000,
  TRAVEL: 1500
};

const AREA_KEYWORDS: Record<string, string[]> = {
  'finance': ['money', 'budget', 'save', 'invest', 'spend', 'finance', 'financial', 'bill', 'bills', 'debt', 'mortgage', 'rent', 'loan', 'loans', 'expense', 'expenses', 'payment', 'payments', 'salary', 'income', 'car', 'fix', 'repair', 'sell'],
  'health': ['health', 'fitness', 'exercise', 'gym', 'workout', 'run', 'running', 'jog', 'jogging', 'yoga', 'diet', 'nutrition', 'food', 'eat', 'eating', 'weight', 'sleep', 'rest', 'doctor', 'medical', 'medicine', 'mental health', 'therapy', 'hydrate', 'hydration', 'water'],
  'career': ['job', 'work', 'career', 'profession', 'business', 'company', 'interview', 'resume', 'cv', 'promotion', 'raise', 'boss', 'colleague', 'project', 'client', 'meeting', 'deadline', 'email', 'skill', 'skills', 'professional'],
  'relationships': ['friend', 'family', 'partner', 'spouse', 'husband', 'wife', 'boyfriend', 'girlfriend', 'date', 'dating', 'relationship', 'social', 'connection', 'people', 'person', 'talk', 'communicate', 'communication', 'conflict', 'argument', 'fight', 'love', 'trust', 'respect'],
  'personal-growth': ['learn', 'study', 'read', 'book', 'course', 'class', 'workshop', 'skill', 'knowledge', 'growth', 'develop', 'improve', 'goal', 'challenge', 'mindset', 'habit', 'journal', 'reflect', 'reflection', 'personal development'],
  'spirituality': ['spirit', 'spiritual', 'meditate', 'meditation', 'mindful', 'mindfulness', 'yoga', 'belief', 'faith', 'religion', 'religious', 'pray', 'prayer', 'soul', 'meaning', 'purpose', 'value', 'values', 'ethics', 'moral', 'gratitude', 'thankful'],
  'recreation': ['hobby', 'hobbies', 'fun', 'play', 'enjoy', 'entertain', 'entertainment', 'game', 'games', 'movie', 'tv', 'television', 'music', 'art', 'craft', 'travel', 'vacation', 'trip', 'adventure', 'sport', 'sports', 'leisure', 'relax', 'relaxation']
};

class AILifeMapConnector {
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;
  private processingQueue: Array<{ userMessage: string, aiResponse: string }> = [];
  private isProcessing: boolean = false;
  
  constructor() {
    this.initializeOpenAI();
    
    setInterval(() => this.processQueue(), 5000);
  }
  
  private initializeOpenAI(): void {
    try {
      this.openai = new OpenAI({ 
        apiKey: 'placeholder-key', 
        dangerouslyAllowBrowser: true,
        baseURL: '/api/openai' 
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.isInitialized = false;
    }
  }
  
  async analyzeConversation(userMessage: string, aiResponse: string): Promise<void> {
    this.processingQueue.push({ userMessage, aiResponse });
    
    this.performBasicAnalysis(userMessage, aiResponse);
  }
  
  private performBasicAnalysis(userMessage: string, aiResponse: string): void {
    const userMessageLower = userMessage.toLowerCase();
    
    let itemName = "";
    let progress = 0;
    let target = 0;
    let suggestedArea = "";
    let itemCategory = "";
    
    
    const amountPattern = /\$?(\d+)(?:\.(\d+))?(\s+dollars|\s+bucks)?/;
    const amountMatch = userMessageLower.match(amountPattern);
    
    if (amountMatch) {
      progress = parseFloat(amountMatch[1] + (amountMatch[2] ? "." + amountMatch[2] : ""));
    }
    
    
    if (userMessageLower.match(/rent|mortgage|housing|apartment|landlord|lease/)) {
      itemName = FINANCE_ITEM_CATEGORIES.RENT;
      target = DEFAULT_TARGETS.RENT; 
      suggestedArea = "finance";
      itemCategory = "rent";
    } 
    else if (userMessageLower.match(/bill|bills|utility|utilities|electric|water|gas|internet|phone/)) {
      itemName = FINANCE_ITEM_CATEGORIES.BILLS;
      target = DEFAULT_TARGETS.BILLS;
      suggestedArea = "finance";
      itemCategory = "bills";
    } 
    else if (userMessageLower.match(/fix|repair|maintain/) && userMessageLower.match(/car|vehicle|auto/)) {
      itemName = FINANCE_ITEM_CATEGORIES.CAR_FIX;
      target = DEFAULT_TARGETS.CAR_FIX;
      suggestedArea = "finance";
      itemCategory = "car_fix";
    } 
    else if (userMessageLower.match(/sell|sold/) && userMessageLower.match(/car|vehicle|auto/)) {
      itemName = FINANCE_ITEM_CATEGORIES.CAR_SELL;
      progress = 0; 
      target = 4000; 
      suggestedArea = "finance";
      itemCategory = "car_sell";
    } 
    else if (userMessageLower.match(/car|vehicle|auto/) && userMessageLower.match(/payment|loan|finance/)) {
      itemName = FINANCE_ITEM_CATEGORIES.CAR_PAYMENT;
      target = DEFAULT_TARGETS.CAR_PAYMENT;
      suggestedArea = "finance";
      itemCategory = "car_payment";
    } 
    else if (userMessageLower.match(/grocery|groceries|food|supermarket|shopping/)) {
      itemName = FINANCE_ITEM_CATEGORIES.GROCERY;
      target = DEFAULT_TARGETS.GROCERY;
      suggestedArea = "finance";
      itemCategory = "grocery";
    } 
    else if (userMessageLower.match(/emergency|rainy day|backup|reserve/)) {
      itemName = FINANCE_ITEM_CATEGORIES.EMERGENCY;
      target = DEFAULT_TARGETS.EMERGENCY;
      suggestedArea = "finance";
      itemCategory = "emergency";
    } 
    else if (userMessageLower.match(/travel|trip|vacation|holiday|flight/)) {
      itemName = FINANCE_ITEM_CATEGORIES.TRAVEL;
      target = DEFAULT_TARGETS.TRAVEL;
      suggestedArea = "finance";
      itemCategory = "travel";
    } 
    else if (userMessageLower.match(/debt|loan|credit|card|payment/)) {
      itemName = FINANCE_ITEM_CATEGORIES.DEBT;
      target = progress * 5; 
      suggestedArea = "finance";
      itemCategory = "debt";
    } 
    else if (userMessageLower.match(/invest|stock|bond|portfolio|retirement/)) {
      itemName = FINANCE_ITEM_CATEGORIES.INVESTMENT;
      target = progress * 10; 
      suggestedArea = "finance";
      itemCategory = "investment";
    } 
    else if (userMessageLower.match(/workout|exercise|gym|fitness|train|run|jog|walk/)) {
      itemName = HEALTH_ITEM_CATEGORIES.FITNESS;
      target = progress * 2; 
      suggestedArea = "health";
      itemCategory = "fitness";
    } 
   
    else if (userMessageLower.match(/eat|food|diet|nutrition|healthy|meal/)) {
      itemName = HEALTH_ITEM_CATEGORIES.NUTRITION;
      target = progress * 2;
      suggestedArea = "health";
      itemCategory = "nutrition";
    } 
    else if (userMessageLower.match(/water|drink|hydrate|hydration/)) {
      itemName = HEALTH_ITEM_CATEGORIES.HYDRATION;
      target = 8;
      suggestedArea = "health";
      itemCategory = "hydration";
    } 
    else if (userMessageLower.match(/save|saving|money|financial|finance|budget/)) {
      itemName = FINANCE_ITEM_CATEGORIES.SAVINGS;
      target = progress * 5; 
      suggestedArea = "finance";
      itemCategory = "savings";
    } 
    
    else {
     
      const progressMention = lifeMapUtils.detectProgressMention(userMessage);
      
      if (progressMention) {
        const { progress: detectedProgress, target: detectedTarget, topicName } = progressMention;
        
        if (progress === 0) {
          progress = detectedProgress;
        }
        
        if (detectedTarget) {
          target = detectedTarget;
        }
        
        const topicLower = topicName.toLowerCase();
        
        if (topicLower.match(/rent|mortgage|housing/)) {
          itemName = FINANCE_ITEM_CATEGORIES.RENT;
          suggestedArea = "finance";
          itemCategory = "rent";
        } 
        else if (topicLower.match(/bill|utility/)) {
          itemName = FINANCE_ITEM_CATEGORIES.BILLS;
          suggestedArea = "finance";
          itemCategory = "bills";
        } 
        else if (topicLower.match(/car|vehicle/)) {
          itemName = FINANCE_ITEM_CATEGORIES.CAR_PAYMENT;
          suggestedArea = "finance";
          itemCategory = "car_payment";
        } 
        else if (topicLower.match(/gym|workout|exercise/)) {
          itemName = HEALTH_ITEM_CATEGORIES.FITNESS;
          suggestedArea = "health";
          itemCategory = "fitness";
        } 
        else if (progress > 0) {
          itemName = FINANCE_ITEM_CATEGORIES.SAVINGS;
          suggestedArea = "finance";
          itemCategory = "savings";
        }
        
        if (target === 0 && itemCategory === "rent") {
          target = DEFAULT_TARGETS.RENT;
        } else if (target === 0 && progress > 0) {
          target = progress * 5; 
        }
      }
    }
    
    const addConfirmationPhrases = [
      "added that to your",
      "added this to your",
      "updated your progress on",
      "added to your finance",
      "added to your health",
      "i've added this to",
      "i've updated"
    ];
    
    const completionPhrases = [
      "marked as completed",
      "marked as done",
      "completed that task",
      "completed that item",
      "marked that as complete",
      "finished that item",
      "that's been completed",
      "you've finished that"
    ];
    
    const removalPhrases = [
      "removed that from your",
      "deleted that from your",
      "removed it from your",
      "i've removed that",
      "i've deleted that",
      "taken that off your list",
      "removed that item",
      "deleted that item",
      "removed from your life map",
      "cleared that from your"
    ];
    
    const hasAddConfirmation = addConfirmationPhrases.some(phrase => 
      aiResponse.toLowerCase().includes(phrase)
    );
    
    const hasCompletionConfirmation = completionPhrases.some(phrase => 
      aiResponse.toLowerCase().includes(phrase)
    );
    
    const hasRemovalConfirmation = removalPhrases.some(phrase => 
      aiResponse.toLowerCase().includes(phrase)
    );
    
    if (suggestedArea && hasAddConfirmation && itemName && progress > 0) {
      const activeAreas = lifeMapUtils.getActiveAreas();
      const isAreaActive = activeAreas.some(area => area.id === suggestedArea);
      
      if (isAreaActive) {
        let note = "";
        let details = "";
        
        if (itemCategory === "rent") {
          note = `Your goal is to save $${target} for your rent payment. You've already saved $${progress}, which is ${Math.round((progress/target)*100)}% of your target. Keep going!`;
          details = `Rent Payment Progress: $${progress}/$${target}`;
        } 
        else if (itemCategory === "bills") {
          note = `Your goal is to set aside $${target} for bills this month. So far you've saved $${progress}. Keep tracking your progress here.`;
          details = `Bills Payment Progress: $${progress}/$${target}`;
        } 
        else if (itemCategory === "car_fix") {
          note = `You need approximately $${target} to fix your car. You've set aside $${progress} so far. Once fixed, you can consider selling it.`;
          details = `Car Repair Fund: $${progress}/$${target}`;
        } 
        else if (itemCategory === "car_sell") {
          note = `Your goal is to sell your car for around $${target}. Make sure it's in good condition first to get the best price.`;
          details = `Target Selling Price: $${target}`;
        } 
        else if (itemCategory === "car_payment") {
          note = `You're saving for your car payment of $${target}. You've put aside $${progress} so far.`;
          details = `Car Payment Progress: $${progress}/$${target}`;
        } 
        else if (itemCategory === "grocery") {
          note = `Your grocery budget is $${target} for the month. You've allocated $${progress} so far.`;
          details = `Grocery Budget: $${progress}/$${target}`;
        } 
        else if (itemCategory === "emergency") {
          note = `Your emergency fund goal is $${target}. You've saved $${progress} so far, which is ${Math.round((progress/target)*100)}% complete. Financial experts recommend having 3-6 months of expenses saved.`;
          details = `Emergency Fund: $${progress}/$${target}`;
        } 
        else if (itemCategory === "travel") {
          note = `Your travel fund goal is $${target}. You've saved $${progress} so far. Keep adding to this fund for your next trip!`;
          details = `Travel Fund: $${progress}/$${target}`;
        } 
        else if (itemCategory === "debt") {
          note = `Your goal is to pay off $${target} in debt. You've paid $${progress} so far. Keep going until you're debt-free!`;
          details = `Debt Payoff Progress: $${progress}/$${target}`;
        } 
        else if (itemCategory === "investment") {
          note = `Your investment goal is $${target}. You've invested $${progress} so far. Consistent investments compound over time.`;
          details = `Investment Progress: $${progress}/$${target}`;
        } 
        else if (itemCategory === "fitness") {
          note = `You've completed ${progress} workouts toward your goal of ${target}. Consistency is key for fitness results.`;
          details = `Fitness Progress: ${progress}/${target} sessions`;
        } 
        else if (itemCategory === "nutrition") {
          note = `You've had ${progress} healthy meals toward your goal of ${target}. Proper nutrition is essential for your health goals.`;
          details = `Nutrition Progress: ${progress}/${target} meals`;
        } 
        else if (itemCategory === "hydration") {
          note = `You've had ${progress} glasses of water toward your daily goal of ${target}. Staying hydrated improves energy and overall health.`;
          details = `Hydration Progress: ${progress}/${target} glasses`;
        } 
        else if (itemCategory === "savings") {
          note = `Your savings goal is $${target}. You've saved $${progress} so far, which is ${Math.round((progress/target)*100)}% complete.`;
          details = `Savings Progress: $${progress}/$${target}`;
        }
        else {
          note = `Your goal is to reach ${target} ${itemName}. Current progress: ${progress}. Keep going!`;
          details = `Progress: ${progress}/${target}`;
        }
        
        const similarItems = lifeMapUtils.findItems(itemName);
        const matchingItem = similarItems.find(item => item.areaId === suggestedArea);
        
        if (matchingItem) {
          lifeMapUtils.updateItem(matchingItem.item.id, {
            progress,
            target,
            details: details,
            note: note
          });
        } else {
          const newItemId = lifeMapUtils.addItem(
            suggestedArea,
            itemName,  
            details,
            note,
            progress,
            target
          );
          
          if (itemName === FINANCE_ITEM_CATEGORIES.CAR_FIX && newItemId) {
            lifeMapUtils.addDependentItem(
              suggestedArea,
              FINANCE_ITEM_CATEGORIES.CAR_SELL,
              `This depends on fixing the car first. Expected value: $4,000`,
              `After fixing your car, you'll be able to sell it for a better price. Aim for at least $4,000.`,
              0,
              4000,
              newItemId
            );
          }
        }
      }
    }
    
    if (hasCompletionConfirmation && userMessage) {
      const userTerms = userMessage.toLowerCase().split(/\s+/);
      const potentialItems: string[] = [];
      
      const commonWords = ["the", "a", "an", "i", "my", "of", "for", "to", "in", "with", "and", "is", "are", "was", "were"];
      userTerms.forEach(term => {
        if (term.length > 3 && !commonWords.includes(term)) {
          potentialItems.push(term);
        }
      });
      
      if (potentialItems.length > 0) {
        let matchingItems: { item: TreeNode, areaId: string }[] = [];
        
        potentialItems.forEach(term => {
          const foundItems = lifeMapUtils.findItems(term);
          matchingItems = [...matchingItems, ...foundItems];
        });
        
        if (matchingItems.length > 0) {
          matchingItems.forEach(matchingItem => {
            lifeMapUtils.updateItem(matchingItem.item.id, {
              status: 'completed',
              progress: matchingItem.item.target || 100,
            });
            
          });
        }
      }
    }
    
    if (hasRemovalConfirmation && userMessage) {
      const userTerms = userMessage.toLowerCase().split(/\s+/);
      const potentialItems: string[] = [];
      
      const commonWords = ["the", "a", "an", "i", "my", "of", "for", "to", "in", "with", "and", "is", "are", "was", "were"];
      userTerms.forEach(term => {
        if (term.length > 3 && !commonWords.includes(term)) {
          potentialItems.push(term);
        }
      });
      
      if (potentialItems.length > 0) {
        let matchingItems: { item: TreeNode, areaId: string }[] = [];
        
        potentialItems.forEach(term => {
          const foundItems = lifeMapUtils.findItems(term);
          matchingItems = [...matchingItems, ...foundItems];
        });
        
        if (matchingItems.length > 0) {
          matchingItems.forEach(matchingItem => {
            if (lifeMapUtils.getDependentItems(matchingItem.item.id).length === 0) {
              const deleted = lifeMapUtils.deleteItem(matchingItem.item.id);
              if (deleted) {
              }
            } else {
              lifeMapUtils.updateItem(matchingItem.item.id, {
                status: 'completed',
                progress: matchingItem.item.target || 100,
              });
            }
          });
        }
      }
    }
    
    const activationPhrases = [
      "i've added this to your",
      "i have added this to your",
      "added to your life map",
      "added this to your life map"
    ];
    
    const hasActivationPhrase = activationPhrases.some(phrase => 
      aiResponse.toLowerCase().includes(phrase)
    );
    
    if (hasActivationPhrase) {
      const allAreas = lifeMapUtils.getAllAreas();
      
      allAreas.forEach(area => {
        if (!area.active) {
          const areaMentions = [
            ...AREA_KEYWORDS[area.id] || [],
            area.name.toLowerCase(),
          ];
          
          const normalizedAIResponse = aiResponse.toLowerCase();
          
          if (areaMentions.some(keyword => normalizedAIResponse.includes(keyword))) {
            if (normalizedAIResponse.includes(area.name.toLowerCase()) && 
                normalizedAIResponse.includes("life map")) {
              lifeMapUtils.activateLifeArea(area.id);
            }
          }
        }
      });
    }
  }
  
  private async processQueue(): Promise<void> {
    if (!this.isInitialized || this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const { userMessage, aiResponse } = this.processingQueue.shift()!;
      
      const mapSummary = lifeMapUtils.getMapSummary();
      
      const analysisPrompt = `
You are an AI that helps manage a user's Life Areas Map. This map organizes the user's life into key areas, and helps them track tasks, goals, and activities.

Current Map Summary:
${mapSummary}

Please analyze the following conversation and identify any tasks, goals, progress updates, or life areas that should be added or updated in the map.

User Message: "${userMessage}"

AI Response: "${aiResponse}"

IMPORTANT GUIDELINES:
1. Only create items in the Finance and Health areas unless explicit activation was confirmed
2. Use clear, structured naming for items (e.g., "Pay Rent" not "saved money for rent")
3. For financial items, always include proper progress tracking with amounts
4. Create logical dependencies between items when appropriate (e.g., Fix Car → Sell Car)
5. Provide meaningful guidance notes that explain next steps for users
6. Always include a proper target amount for financial goals (e.g., $2030 for rent)
7. If the user mentions saving money for rent, create a "Pay Rent" item with proper tracking

Respond with JSON that includes the following information:
1. New Life Areas to activate (if any) - but only include if explicitly confirmed
2. New items to add to the map (using proper structured naming)
3. Updates to existing items (progress, completion status, etc.)
4. Dependent items to add (follow-up tasks that depend on existing ones)

Use this format:
{
  "activateAreas": ["area-id1", "area-id2"],
  "newItems": [
    {
      "areaId": "area-id",
      "name": "Item name",
      "details": "Details about the item",
      "note": "Your goal is to [accomplish specific task]. Keep adding progress as you go. Current status: [specific details]",
      "progress": number,
      "target": number
    }
  ],
  "updateItems": [
    {
      "searchTerm": "Search term to find the item",
      "updates": {
        "progress": number,
        "target": number,
        "status": "completed|in-progress|not-started"
      }
    }
  ],
  "dependentItems": [
    {
      "parentSearchTerm": "Search term to find parent item",
      "name": "Dependent item name",
      "details": "This depends on completing [parent task] first. Expected outcome: [specific details]",
      "note": "After completing [parent task], you'll be able to [specific next steps]. Aim for [specific target]."
    }
  ]
}
`;

      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a helpful assistant that analyzes conversations and extracts information for a Life Areas Map." },
              { role: "user", content: analysisPrompt }
            ],
            response_format: { type: "json_object" }
          });
          
          const responseContent = response.choices[0].message.content || '{}';
          await this.processAnalysisResults(responseContent);
        } catch (error) {
          console.error('Error processing map updates:', error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async processAnalysisResults(analysisResult: string): Promise<void> {
    try {
      const analysis = JSON.parse(analysisResult);
      
      const activeAreas = lifeMapUtils.getActiveAreas().map(area => area.id);
      
      const standardizedNames: Record<string, string> = {
        'rent': FINANCE_ITEM_CATEGORIES.RENT,
        'housing': FINANCE_ITEM_CATEGORIES.RENT,
        'mortgage': FINANCE_ITEM_CATEGORIES.RENT,
        'bills': FINANCE_ITEM_CATEGORIES.BILLS,
        'utilities': FINANCE_ITEM_CATEGORIES.BILLS,
        'car repair': FINANCE_ITEM_CATEGORIES.CAR_FIX,
        'fix car': FINANCE_ITEM_CATEGORIES.CAR_FIX,
        'sell car': FINANCE_ITEM_CATEGORIES.CAR_SELL,
        'car payment': FINANCE_ITEM_CATEGORIES.CAR_PAYMENT,
        'groceries': FINANCE_ITEM_CATEGORIES.GROCERY,
        'food': FINANCE_ITEM_CATEGORIES.GROCERY,
        'emergency': FINANCE_ITEM_CATEGORIES.EMERGENCY,
        'travel': FINANCE_ITEM_CATEGORIES.TRAVEL,
        'vacation': FINANCE_ITEM_CATEGORIES.TRAVEL,
        'debt': FINANCE_ITEM_CATEGORIES.DEBT,
        'investment': FINANCE_ITEM_CATEGORIES.INVESTMENT,
        'savings': FINANCE_ITEM_CATEGORIES.SAVINGS,
        
        'fitness': HEALTH_ITEM_CATEGORIES.FITNESS,
        'exercise': HEALTH_ITEM_CATEGORIES.FITNESS,
        'workouts': HEALTH_ITEM_CATEGORIES.FITNESS,
        'nutrition': HEALTH_ITEM_CATEGORIES.NUTRITION,
        'diet': HEALTH_ITEM_CATEGORIES.NUTRITION,
        'hydration': HEALTH_ITEM_CATEGORIES.HYDRATION,
        'water': HEALTH_ITEM_CATEGORIES.HYDRATION,
        'sleep': HEALTH_ITEM_CATEGORIES.SLEEP,
        'mental health': HEALTH_ITEM_CATEGORIES.MENTAL
      };
      
      const getStandardizedName = (name: string): string => {
        if (standardizedNames[name.toLowerCase()]) {
          return standardizedNames[name.toLowerCase()];
        }
        
        for (const [key, value] of Object.entries(standardizedNames)) {
          if (name.toLowerCase().includes(key)) {
            return value;
          }
        }
        
        return name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
      
      
      if (analysis.newItems && Array.isArray(analysis.newItems)) {
        analysis.newItems.forEach((item: any) => {
          if (item.areaId && item.name && activeAreas.includes(item.areaId)) {
            const standardizedName = getStandardizedName(item.name);
            
            lifeMapUtils.addItem(
              item.areaId,
              standardizedName,
              item.details || `Added on ${new Date().toLocaleDateString()}`,
              item.note || `Take action on this ${standardizedName.toLowerCase()}.`,
              item.progress,
              item.target
            );
          }
        });
      }
      
      if (analysis.updateItems && Array.isArray(analysis.updateItems)) {
        analysis.updateItems.forEach((updateInfo: any) => {
          if (updateInfo.searchTerm && updateInfo.updates) {
            const standardizedSearchTerm = getStandardizedName(updateInfo.searchTerm);
            
            const items = lifeMapUtils.findItems(standardizedSearchTerm);
            
            if (items.length > 0) {
              lifeMapUtils.updateItem(items[0].item.id, updateInfo.updates);
            } else {
              const originalItems = lifeMapUtils.findItems(updateInfo.searchTerm);
              if (originalItems.length > 0) {
                lifeMapUtils.updateItem(originalItems[0].item.id, updateInfo.updates);
              }
            }
          }
        });
      }
      
      if (analysis.dependentItems && Array.isArray(analysis.dependentItems)) {
        analysis.dependentItems.forEach((depItem: any) => {
          if (depItem.parentSearchTerm && depItem.name) {
            const items = lifeMapUtils.findItems(depItem.parentSearchTerm);
            
            if (items.length > 0) {
              const parentItem = items[0].item;
              const parentAreaId = items[0].areaId;
              
              if (parentAreaId && parentItem.id) {
                const progress = depItem.progress !== undefined ? depItem.progress : 0;
                const target = depItem.target !== undefined ? depItem.target : 0;
                
                let note = depItem.note;
                if (!note) {
                  if (depItem.name.toLowerCase().includes('sell') && parentItem.name.toLowerCase().includes('fix')) {
                    note = `After fixing your car, you'll be able to sell it for a better price. Aim for at least $4,000.`;
                  } else {
                    note = `This step depends on completing "${parentItem.name}" first. Complete the previous step before starting this one.`;
                  }
                }
                
                let details = depItem.details;
                if (!details) {
                  if (depItem.name.toLowerCase().includes('sell') && parentItem.name.toLowerCase().includes('fix')) {
                    details = `This depends on fixing the car first. Expected value: $4,000`;
                  } else {
                    details = `This step follows ${parentItem.name}. Added on ${new Date().toLocaleDateString()}.`;
                  }
                }
                
                lifeMapUtils.addDependentItem(
                  parentAreaId,
                  depItem.name,
                  details,
                  note,
                  progress,
                  target,
                  parentItem.id
                );
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing or applying analysis results:', error);
    }
  }
}

export const aiLifeMapConnector = new AILifeMapConnector();

export default aiLifeMapConnector;