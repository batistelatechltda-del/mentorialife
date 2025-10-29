export interface QuestionProps {
  onNext?: () => void;
  onBack?: () => void;
}

export interface OnboardingData {
  preferredName: string;
  lifeAreaPriority?: string | string[];
  morningEnergy?: string | string[];
  preferredStructure?: string | string[];
  communicationStyle?: string | string[];
  reminderPreference?: string | string[];
  mentorName?: string;
  voiceResponses?: {
    preferredName?: string;
    lifeAreaPriority?: string;
    morningEnergy?: string;
    preferredStructure?: string;
    communicationStyle?: string;
    reminderPreference?: string;
  };
}

export interface UserProfile {
  id: number;
  userId: string;
  preferredName: string;
  lifeAreaPriority?: any;
  morningEnergy?: any;
  preferredStructure?: any;
  communicationStyle?: any;
  reminderPreference?: any;
  mentorName?: string;
  lifeMapData?: any;
  journalData?: any;
  goalsData?: any;
  remindersData?: any;
}

export interface OnboardingAnswers {
  user_id: string;
  onboarding_answers: {
    q1: string; 
    q2: string[]; 
    q3: string[]; 
    q4: string[]; 
    q5: string[]; 
    q6: string[]; 
    q7: string; 
    name_for_mentor?: string; 
    voice_responses?: {
      preferredName?: string;
      lifeAreaPriority?: string;
      morningEnergy?: string;
      preferredStructure?: string;
      communicationStyle?: string;
      reminderPreference?: string;
    };
  };
}

export function getOnboardingAnswers(): any | null {
  if (typeof window !== "undefined") {
    try {
      const answersStr = localStorage.getItem("onboarding_answers");
      if (!answersStr) return null;

      const answers = JSON.parse(answersStr) as OnboardingAnswers;

      if (!answers || !answers.onboarding_answers) {
        return null;
      }

      return answers;
    } catch (error) {
      console.error("Error parsing onboarding answers:", error);
      return null;
    }
  }
}

export function getOnboardingAnswer(
  questionNumber: number,
  defaultValue: any = null
): any {
  try {
    const answers = getOnboardingAnswers();
    if (!answers || !answers.onboarding_answers) return defaultValue;

    const key = `q${questionNumber}` as keyof typeof answers.onboarding_answers;
    return answers.onboarding_answers[key] || defaultValue;
  } catch (error) {
    console.error(`Error getting answer for q${questionNumber}:`, error);
    return defaultValue;
  }
}
