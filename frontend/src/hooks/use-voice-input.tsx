import { useState, useEffect, useRef } from 'react';
import voiceRecognition from '../utils/voiceRecognition';

interface UseVoiceInputProps {
  onFinalTranscript?: (transcript: string) => void;
  autoStop?: boolean;
  autoStopDelay?: number;
}

export const useVoiceInput = ({
  onFinalTranscript,
  autoStop = false,
  autoStopDelay = 2000,
}: UseVoiceInputProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (isRecording) {
        voiceRecognition.stop();
      }
      
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, [isRecording]);
  
  const resetAutoStopTimeout = () => {
    if (autoStop && autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, autoStopDelay);
    }
  };
  
  const startRecording = () => {
    if (!voiceRecognition.isSupported()) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    setIsRecording(true);
    
    const success = voiceRecognition.start({
      onStart: () => {
        setTranscript('');
        setInterimTranscript('');
        
        if (autoStop) {
          resetAutoStopTimeout();
        }
      },
      onEnd: () => {
        setIsRecording(false);
        setInterimTranscript('');
      },
      onError: (event) => {
        console.error('Voice recognition error:', event);
        setIsRecording(false);
      },
      onInterimResult: (result, resultConfidence) => {
        setInterimTranscript(result);
        setConfidence(resultConfidence);
        
        if (autoStop) {
          resetAutoStopTimeout();
        }
      },
      onFinalResult: (result, resultConfidence) => {
        setTranscript((prev) => {
          const newTranscript = prev ? `${prev} ${result}` : result;
          
          if (onFinalTranscript) {
            onFinalTranscript(newTranscript);
          }
          
          return newTranscript;
        });
        
        setConfidence(resultConfidence);
        setInterimTranscript('');
        
        if (autoStop) {
          resetAutoStopTimeout();
        }
      },
      continuous: true,
      language: 'en-US',
    });
    
    if (!success) {
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    voiceRecognition.stop();
    setIsRecording(false);
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const currentText = interimTranscript ? `${transcript} ${interimTranscript}` : transcript;
  
  return {
    isRecording,
    transcript,
    interimTranscript,
    currentText,
    confidence,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}