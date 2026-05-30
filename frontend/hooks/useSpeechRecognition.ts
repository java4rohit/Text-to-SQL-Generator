import { useState, useEffect, useRef } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  browserSupported: boolean;
  toggleVoiceInput: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export const useSpeechRecognition = (
  onTranscript: (transcript: string) => void,
  onError?: (error: string) => void
): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initializeSpeechRecognition();
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setBrowserSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed' && onError) {
          onError('Microphone access denied. Please allow microphone permissions.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  };

  const startListening = () => {
    if (!browserSupported) {
      if (onError) {
        onError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
      return;
    }

    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (!browserSupported) {
      if (onError) {
        onError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      if (onError) {
        onError(''); // Clear any previous errors
      }
      startListening();
    }
  };

  return {
    isListening,
    browserSupported,
    toggleVoiceInput,
    startListening,
    stopListening,
  };
};
