import React, { useEffect } from 'react';
import { useVoiceInput } from '../hooks/use-voice-input';

interface VoiceInputProps {
  onTextChange: (text: string) => void;
  placeholder?: string;
  initialText?: string;
  showTranscriptArea?: boolean;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextChange,
  placeholder = "Speak your response...",
  initialText = "",
  showTranscriptArea = true,
  className = "",
}) => {
  const {
    isRecording,
    currentText,
    transcript,
    interimTranscript,
    toggleRecording,
  } = useVoiceInput({
    onFinalTranscript: (text) => {
      onTextChange(text);
    },
    autoStop: true,
    autoStopDelay: 3000, 
  });

  useEffect(() => {
    if (initialText && !transcript) {
      onTextChange(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (transcript) {
      onTextChange(transcript);
    }
  }, [transcript, onTextChange]);

  return (
    <div className={`voice-input-container ${className}`}>
      {showTranscriptArea && (
        <div className={`voice-transcript ${isRecording ? 'recording' : ''}`}>
          <p className="transcript">
            {currentText || placeholder}
            {isRecording && !currentText && <span className="recording-dots">...</span>}
            {isRecording && interimTranscript && (
              <span className="interim">{interimTranscript}</span>
            )}
          </p>
          {isRecording && (
            <div className="recording-indicator">
              <span className="pulse"></span>
              <span>Recording...</span>
            </div>
          )}
        </div>
      )}

      <button
        className={`mic-button ${isRecording ? 'recording' : ''}`}
        onClick={toggleRecording}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <span className="material-icons">{isRecording ? 'stop' : 'mic'}</span>
      </button>

    </div>
  );
};

export default VoiceInput;