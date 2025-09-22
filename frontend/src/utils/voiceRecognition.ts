
interface VoiceRecognitionOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (event: any) => void;
  onInterimResult?: (transcript: string, confidence: number) => void;
  onFinalResult?: (transcript: string, confidence: number) => void;
  continuous?: boolean;
  language?: string;
}

class VoiceRecognitionService {
  recognition: any | null = null;
  isListening: boolean = false;
  transcript: string = "";
  confidence: number = 0;

  constructor() {
    const SpeechRecognitionAPI = (window.SpeechRecognition ||
      window.webkitSpeechRecognition)

    if (!SpeechRecognitionAPI) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    try {
      this.recognition = new SpeechRecognitionAPI();
      this.setupDefaults();
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      this.recognition = null;
    }
  }

  private setupDefaults() {
    if (this.recognition) {
      this.recognition.lang = "en-US";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  start(options: VoiceRecognitionOptions = {}) {
    if (!this.recognition) {
      alert("Speech recognition is not supported in your browser.");
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    const recognition = this.recognition;

    recognition.continuous =
      options.continuous !== undefined ? options.continuous : true;
    recognition.lang = options.language || "en-US";

    recognition.onstart = () => {
      this.isListening = true;
      if (options.onStart) options.onStart();
    };

    recognition.onend = () => {
      this.isListening = false;
      if (options.onEnd) options.onEnd();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      if (options.onError) options.onError(event);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";
      let highestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
        }

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.transcript = finalTranscript;
          this.confidence = highestConfidence;

          if (options.onFinalResult) {
            options.onFinalResult(finalTranscript, highestConfidence);
          }
        } else {
          interimTranscript += transcript;

          if (options.onInterimResult) {
            options.onInterimResult(interimTranscript, confidence);
          }
        }
      }
    };

    try {
      recognition.start();
      return true;
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

const voiceRecognition = new VoiceRecognitionService();
export default voiceRecognition;
