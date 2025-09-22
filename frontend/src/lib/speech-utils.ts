export interface SpeechConfig {
  language: string;
  enablePunctuation: boolean;
  model: "default" | "latest_long" | "latest_short";
}

export const defaultSpeechConfig: SpeechConfig = {
  language: "en-US",
  enablePunctuation: true,
  model: "latest_long",
};

export const supportedLanguages = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-US", name: "Spanish (US)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "it-IT", name: "Italian (Italy)" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "ja-JP", name: "Japanese (Japan)" },
  { code: "ko-KR", name: "Korean (South Korea)" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
];

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state === "granted";
  } catch (error) {
    console.warn(
      "Permission API not supported, checking getUserMedia directly"
    );
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
};

export const formatAudioDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const validateAudioFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; 
  const allowedTypes = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg"];

  if (file.size > maxSize) {
    return { valid: false, error: "Audio file too large (max 10MB)" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Unsupported audio format" };
  }

  return { valid: true };
};
