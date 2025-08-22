class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voices = [];
    this.setupSpeechRecognition();
    this.loadVoices();
  }

  setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    if (this.voices.length === 0) {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.voices = this.synthesis.getVoices();
      });
    }
  }

  isSupported() {
    return this.recognition !== null;
  }

  startListening(onResult, onError, onStart) {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      onResult(transcript, confidence);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError('Failed to start speech recognition: ' + error.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, personality = 'neutral', onStart, onEnd) {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice based on personality
    this.configureVoice(utterance, personality);

    if (onStart) {
      utterance.onstart = onStart;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };

    this.synthesis.speak(utterance);
  }

  configureVoice(utterance, personality) {
    // Default settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Adjust based on personality
    switch (personality) {
      case 'tough':
      case 'intimidating':
        utterance.rate = 0.8;
        utterance.pitch = 0.8;
        utterance.volume = 0.9;
        break;
      case 'friendly':
      case 'supportive':
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        utterance.volume = 0.8;
        break;
      case 'chatty':
        utterance.rate = 1.1;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        break;
      case 'empathetic':
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 0.7;
        break;
      case 'skeptical':
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
        utterance.volume = 0.8;
        break;
      default: // neutral
        break;
    }
  }

  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  isSpeaking() {
    return this.synthesis.speaking;
  }

  getRecognitionStatus() {
    return {
      supported: this.recognition !== null,
      listening: this.isListening
    };
  }

  getSynthesisStatus() {
    return {
      supported: 'speechSynthesis' in window,
      speaking: this.synthesis.speaking,
      pending: this.synthesis.pending,
      paused: this.synthesis.paused
    };
  }
}

export default new SpeechManager();