import { useState, useEffect, useCallback, useRef } from 'react';

export type MicState = 
  | 'Ready'
  | 'Listening'
  | 'User Speaking'
  | 'Processing'
  | 'AI Thinking'
  | 'AI Speaking'
  | 'Finished'
  | 'Permission Denied'
  | 'No Speech Detected'
  | 'Network Error'
  | 'Stopped';

export type VoiceGender = 'auto' | 'male' | 'female';

export interface VoiceSettings {
  gender: VoiceGender;
  voiceURI: string;
  speed: number; // 0.5 to 2.0 (default 1.0)
  pitch: number; // 0.5 to 1.5 (default 1.0)
  volume: number; // 0.0 to 1.0 (default 1.0)
  autoPlay: boolean; // default true
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  gender: 'auto',
  voiceURI: '',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoPlay: true,
};

const STORAGE_KEY = 'interviewai_voice_settings';

interface UseVoiceSpeechOptions {
  silenceTimeoutMs?: number;
  onSilenceAutoSubmit?: (transcript: string) => void;
  onFinalResult?: (newChunk: string, fullTranscript: string) => void;
}

export function useVoiceSpeech(options: UseVoiceSpeechOptions = {}) {
  const { 
    silenceTimeoutMs = 2500, 
    onSilenceAutoSubmit,
    onFinalResult 
  } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [micState, setMicState] = useState<MicState>('Stopped');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Available system voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [maleVoices, setMaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Voice settings state persisted in localStorage
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_VOICE_SETTINGS;
  });

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const processedIndexesRef = useRef<Set<number>>(new Set());
  const finalTranscriptRef = useRef<string>('');

  // Keep ref in sync for callbacks
  useEffect(() => {
    finalTranscriptRef.current = finalTranscript;
  }, [finalTranscript]);

  // Load and classify browser voices
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setAvailableVoices(voices);

      const maleKeywords = ['david', 'daniel', 'alex', 'george', 'fred', 'oliver', 'rishi', 'mark', 'james', 'male', 'guy', 'brian', 'andrew', 'thomas', 'richard'];
      const femaleKeywords = ['zira', 'samantha', 'karen', 'victoria', 'moira', 'fiona', 'tessa', 'veena', 'female', 'aria', 'jenny', 'sara', 'catherine', 'helena', 'lisa', 'clara'];

      const maleList = voices.filter(v => {
        const name = v.name.toLowerCase();
        return maleKeywords.some(kw => name.includes(kw));
      });

      const femaleList = voices.filter(v => {
        const name = v.name.toLowerCase();
        return femaleKeywords.some(kw => name.includes(kw));
      });

      setMaleVoices(maleList.length > 0 ? maleList : voices);
      setFemaleVoices(femaleList.length > 0 ? femaleList : voices);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeechRec = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setIsSupported(hasSpeechRec);
      if (hasSpeechRec) {
        setMicState('Ready');
      }

      loadVoices();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [loadVoices]);

  // Update voice settings & persist to localStorage
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setVoiceSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Stop Speech Synthesis (AI Voice) immediately (Barge-in support)
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  // Stop Speech Recognition
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearSilenceTimer();
    setInterimTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setMicState('Stopped');
  }, [clearSilenceTimer]);

  // Silence auto-detection with automatic submission
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Silence detected after candidate spoke
      const currentText = finalTranscriptRef.current.trim();
      if (currentText.length > 0 && onSilenceAutoSubmit) {
        setMicState('Processing');
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (e) {}
        onSilenceAutoSubmit(currentText);
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs, onSilenceAutoSubmit]);

  // Clean consecutive duplicate words (e.g. "I I think think" -> "I think")
  const deduplicateWords = (str: string): string => {
    return str
      .split(/\s+/)
      .filter((word, idx, arr) => idx === 0 || word.toLowerCase() !== arr[idx - 1].toLowerCase())
      .join(' ');
  };

  // Start Speech Recognition
  const startListening = useCallback(() => {
    if (!isSupported || typeof window === 'undefined') return;

    // Interrupt AI voice immediately (Barge-in / Gemini Live experience)
    stopSpeaking();

    // Cancel any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    isManuallyStoppedRef.current = false;
    processedIndexesRef.current.clear();
    setInterimTranscript('');
    setMicState('Listening');

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setMicState('Listening');
    };

    recognition.onaudiostart = () => {
      setMicState('User Speaking');
    };

    recognition.onsoundstart = () => {
      setMicState('User Speaking');
      stopSpeaking(); // Immediate barge-in on audio detection
    };

    recognition.onspeechstart = () => {
      setMicState('User Speaking');
      stopSpeaking();
    };

    recognition.onresult = (event: any) => {
      stopSpeaking();
      setMicState('User Speaking');
      resetSilenceTimer();

      let interim = '';
      let newlyFinalized = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = (result[0]?.transcript || '').trim();

        if (result.isFinal) {
          if (!processedIndexesRef.current.has(i) && text.length > 0) {
            processedIndexesRef.current.add(i);
            newlyFinalized += (newlyFinalized ? ' ' : '') + text;
          }
        } else {
          interim += (interim ? ' ' : '') + text;
        }
      }

      if (newlyFinalized.trim()) {
        const cleanChunk = deduplicateWords(newlyFinalized.trim());
        setFinalTranscript((prev) => {
          const combined = prev ? `${prev.trim()} ${cleanChunk}` : cleanChunk;
          const deduped = deduplicateWords(combined);
          if (onFinalResult) {
            onFinalResult(cleanChunk, deduped);
          }
          return deduped;
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onspeechend = () => {
      resetSilenceTimer();
    };

    recognition.onerror = (event: any) => {
      clearSilenceTimer();
      setInterimTranscript('');

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicState('Permission Denied');
      } else if (event.error === 'no-speech') {
        setMicState('No Speech Detected');
      } else if (event.error === 'network') {
        setMicState('Network Error');
      } else {
        console.warn('Speech recognition warning:', event.error);
        setMicState('Stopped');
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setInterimTranscript('');
      // If recognition dropped unexpectedly while in candidate turn, gracefully auto-restart
      if (!isManuallyStoppedRef.current && isSupported) {
        setMicState('Ready');
      } else {
        setMicState('Stopped');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      setMicState('Stopped');
    }
  }, [isSupported, onFinalResult, resetSilenceTimer, clearSilenceTimer, stopSpeaking]);

  // Select matching voice based on settings
  const pickVoice = useCallback((settings: VoiceSettings, voices: SpeechSynthesisVoice[]) => {
    if (!voices || voices.length === 0) return null;

    // 1. Explicit voiceURI
    if (settings.voiceURI) {
      const match = voices.find(v => v.voiceURI === settings.voiceURI);
      if (match) return match;
    }

    // 2. Gender filtering
    if (settings.gender === 'male' && maleVoices.length > 0) {
      return maleVoices.find(v => v.lang.startsWith('en')) || maleVoices[0];
    }
    if (settings.gender === 'female' && femaleVoices.length > 0) {
      return femaleVoices.find(v => v.lang.startsWith('en')) || femaleVoices[0];
    }

    // 3. Auto default: look for natural sounding English voice
    const naturalEnglish = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online')));
    if (naturalEnglish) return naturalEnglish;

    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, [maleVoices, femaleVoices]);

  // Speak text with Web Speech API
  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Pause mic while AI is talking to avoid echo
    stopListening();
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Math.max(0.5, Math.min(1.75, voiceSettings.speed));
    utterance.pitch = Math.max(0.7, Math.min(1.3, voiceSettings.pitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, voiceSettings.volume));
    utterance.lang = 'en-US';

    const chosenVoice = pickVoice(voiceSettings, availableVoices);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    currentUtteranceRef.current = utterance;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setMicState('AI Speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      setMicState('Listening');
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      setMicState('Ready');
      if (onEndCallback) {
        onEndCallback();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [stopListening, voiceSettings, pickVoice, availableVoices]);

  // Test voice helper
  const testVoice = useCallback((customPhrase?: string) => {
    const testPhrase = customPhrase || `Hello! I am your AI interviewer. How does this voice sound to you?`;
    speakText(testPhrase);
  }, [speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearSilenceTimer]);

  return {
    isSupported,
    micState,
    setMicState,
    isListening: micState === 'Listening' || micState === 'User Speaking',
    isUserSpeaking: micState === 'User Speaking',
    isProcessing: micState === 'Processing',
    isThinking: micState === 'AI Thinking',
    isSpeaking,
    interimTranscript,
    finalTranscript,
    setFinalTranscript,
    availableVoices,
    maleVoices,
    femaleVoices,
    voiceSettings,
    updateVoiceSettings,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    testVoice,
    resetTranscript: () => {
      processedIndexesRef.current.clear();
      setFinalTranscript('');
      setInterimTranscript('');
    },
  };
}
