import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft, RotateCcw, Lightbulb } from 'lucide-react';
import aiEngine from '../utils/aiEngine';
import speechManager from '../utils/speechUtils';
import feedbackAnalyzer from '../utils/feedbackAnalyzer';
import FeedbackPanel from './FeedbackPanel';

const levelLabel = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

const ConversationInterface = ({ scenario, personality, onBack, selectedLevel = 'beginner' }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    messagesCount: 0,
    averageConfidence: 0,
    startTime: Date.now()
  });
  const [showTips, setShowTips] = useState(false);

  // Real-time feedback state
  const [realtimeFeedback, setRealtimeFeedback] = useState({
    strengths: [],
    areasToImprove: [],
    confidence: 65, // Start lower to show improvement
    metrics: {
      words: 0,
      sentences: 0,
      fillers: 0,
      questions: 0
    }
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeConversation();

    // Subscribe to real-time feedback updates from AI engine
    const handleRealtimeFeedbackUpdate = (newFeedback) => {
      setRealtimeFeedback(newFeedback);
    };

    if (aiEngine.onFeedbackUpdate) {
      aiEngine.onFeedbackUpdate(handleRealtimeFeedbackUpdate);
    }

    return () => {
      speechManager.stopSpeaking();
      speechManager.stopListening();
      if (aiEngine.removeFeedbackCallback) {
        aiEngine.removeFeedbackCallback(handleRealtimeFeedbackUpdate);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Real-time analysis as user types
    if (currentInput.trim().length > 0) {
      analyzeCurrentInput(currentInput);
    }
  }, [currentInput]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleSendMessage();
            break;
          case ' ':
            e.preventDefault();
            isListening ? stopListening() : startListening();
            break;
          case 'm':
            e.preventDefault();
            toggleAISpeech();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentInput, isListening, isAISpeaking]);

  // Analyze input in real-time as user types
  const analyzeCurrentInput = (input) => {
    if (!input || input.trim().length === 0) return;

    const analysis = performTextAnalysis(input);

    const newFeedback = {
      ...realtimeFeedback,
      metrics: {
        words: analysis.wordCount,
        sentences: analysis.sentenceCount,
        fillers: analysis.fillerCount,
        questions: analysis.questionCount
      }
    };

    // Update strengths and areas to improve based on current input
    updateRealtimeFeedback(input, newFeedback, analysis);
    setRealtimeFeedback(newFeedback);
  };

  const performTextAnalysis = (text) => {
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const fillers = (text.toLowerCase().match(/\b(um|uh|like|you know|basically|actually|well|so|right)\b/g) || [])
      .length;
    const questions = (text.match(/\?/g) || []).length;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      fillerCount: fillers,
      questionCount: questions,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0
    };
  };

  const updateRealtimeFeedback = (input, feedbackObj, analysis) => {
    const newStrengths = [];
    const newAreasToImprove = [];

    // Always provide some feedback to ensure visibility
    if (analysis.wordCount >= 15) {
      newStrengths.push('Providing detailed responses');
    } else if (analysis.wordCount >= 8) {
      newStrengths.push('Good response length');
    } else if (analysis.wordCount > 0 && analysis.wordCount < 5) {
      newAreasToImprove.push('Expand answers with more detail');
    }

    if (analysis.fillerCount === 0 && analysis.wordCount > 5) {
      newStrengths.push('Clear speech without filler words');
    } else if (analysis.fillerCount > 2) {
      newAreasToImprove.push('Reduce filler words (um, uh, like)');
    } else if (analysis.fillerCount > 0) {
      newAreasToImprove.push('Try to minimize filler words');
    }

    if (analysis.avgWordsPerSentence > 8 && analysis.avgWordsPerSentence < 20) {
      newStrengths.push('Well-structured sentences');
    } else if (analysis.avgWordsPerSentence > 25) {
      newAreasToImprove.push('Break down complex sentences');
    }

    // Engagement
    if (analysis.questionCount > 0) {
      newStrengths.push('Asking engaging questions');
    }

    // Confidence words
    const confidenceWords = input.toLowerCase().match(/\b(confident|sure|certain|believe|strong)\b/g);
    if (confidenceWords && confidenceWords.length > 0) {
      newStrengths.push('Expressing confidence');
    }

    const uncertainWords = input.toLowerCase().match(/\b(maybe|perhaps|might|not sure|i think)\b/g);
    if (uncertainWords && uncertainWords.length > 1) {
      newAreasToImprove.push('Show more confidence in responses');
    }

    // Examples
    if (input.toLowerCase().includes('for example') || input.toLowerCase().includes('such as')) {
      newStrengths.push('Supporting points with examples');
    } else if (analysis.wordCount > 15) {
      newAreasToImprove.push('Include specific examples');
    }

    // Ensure we always have some areas to improve
    if (newAreasToImprove.length === 0) {
      newAreasToImprove.push('Practice speaking with more variety');
      newAreasToImprove.push('Consider adding personal anecdotes');
    }

    // Update feedback arrays (keep unique items)
    feedbackObj.strengths = [...new Set([...(feedbackObj.strengths || []), ...newStrengths])].slice(0, 5);
    feedbackObj.areasToImprove = [...new Set([...(feedbackObj.areasToImprove || []), ...newAreasToImprove])].slice(
      0,
      5
    );

    // Update confidence score
    let confidenceAdjustment = 0;
    if (analysis.fillerCount === 0 && analysis.wordCount > 5) confidenceAdjustment += 3;
    if (analysis.wordCount >= 10) confidenceAdjustment += 2;
    if (confidenceWords && confidenceWords.length > 0) confidenceAdjustment += 4;
    if (analysis.questionCount > 0) confidenceAdjustment += 2;

    if (analysis.fillerCount > 2) confidenceAdjustment -= 5;
    if (analysis.wordCount < 5) confidenceAdjustment -= 3;
    if (uncertainWords && uncertainWords.length > 1) confidenceAdjustment -= 3;

    feedbackObj.confidence = Math.max(0, Math.min(100, feedbackObj.confidence + confidenceAdjustment));
  };

  const initializeConversation = async () => {
    // Initialize with some starter feedback
    setRealtimeFeedback({
      strengths: ['Ready to practice!'],
      areasToImprove: [
        'Start by introducing yourself',
        'Speak clearly and confidently',
        'Use specific examples when possible',
        'Ask engaging questions',
        'Maintain good eye contact'
      ],
      confidence: 65,
      metrics: {
        words: 0,
        sentences: 0,
        fillers: 0,
        questions: 0
      }
    });

    const greeting = getGreeting();
    const aiMessage = {
      sender: 'ai',
      text: greeting,
      timestamp: Date.now(),
      confidence: null
    };

    setMessages([aiMessage]);

    // Speak greeting if enabled
    setTimeout(() => {
      if (isAISpeaking) {
        speechManager.speak(greeting, personality);
      }
    }, 500);
  };

  const getGreeting = () => {
    const greetings = {
      tough: "Alright, let's get started. I don't have all day, so make this count. Tell me what you've got.",
      friendly:
        "Hello! I'm so excited to chat with you today. How are you feeling? Ready to have a great conversation?",
      neutral: 'Good day. Please take a moment to collect your thoughts, and we\'ll begin when you\'re ready.',
      skeptical: "Hmm, so you think you're ready for this? I'll be the judge of that. Go ahead, impress me.",
      supportive:
        "Welcome! I'm here to help you practice and improve. Don't worry about making mistakes - that's how we learn!",
      intimidating:
        "So you want to practice with me? This won't be easy. I expect excellence. Let's see what you're made of.",
      chatty:
        'Oh hi there! This is so exciting! I love meeting new people and having conversations. Tell me everything!',
      empathetic:
        'Hello, I can sense you might be a bit nervous, and that\'s completely okay. Take your time and speak from the heart.'
    };
    return greetings[personality] || greetings.neutral;
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: currentInput.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);

    // Analyze user's response for traditional feedback
    if (feedbackAnalyzer && feedbackAnalyzer.analyzeResponse) {
      const analysis = feedbackAnalyzer.analyzeResponse(currentInput, scenario, personality);
      // attach rawText for richer tips in FeedbackPanel
      setFeedback({ ...analysis, rawText: currentInput });
    }

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      messagesCount: prev.messagesCount + 1,
      averageConfidence:
        ((prev.averageConfidence * prev.messagesCount) + realtimeFeedback.confidence) /
        (prev.messagesCount + 1)
    }));

    setIsLoading(true);
    const inputToProcess = currentInput;
    setCurrentInput('');

    try {
      // Always get a response from AI to keep conversation flowing
      const response = await aiEngine.generateResponse(
        inputToProcess,
        personality,
        scenario,
        [...messages, userMessage] // Include the new user message
      );

      const aiMessage = {
        sender: 'ai',
        text: response,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (isAISpeaking) {
        speechManager.speak(response, personality);
      }

      // Generate follow-up if conversation seems to be ending
      setTimeout(() => {
        if (response.length < 50 || !response.includes('?')) {
          generateFollowUpQuestion();
        }
      }, 2000);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Always provide a fallback response to keep conversation going
      const fallbackResponse = getFallbackResponse(inputToProcess, personality);
      const errorMessage = {
        sender: 'ai',
        text: fallbackResponse,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const getFallbackResponse = (userInput, p) => {
    const responses = {
      tough: "That's interesting. Give me more details and show me some real substance.",
      friendly: "That's great! Can you tell me more about that? I'd love to hear your thoughts!",
      neutral: 'Please elaborate on that point and provide additional context.',
      skeptical: "I'm not entirely convinced. Can you provide more evidence for that claim?",
      supportive: "You're doing well! Can you expand on that and share more of your experience?",
      intimidating: 'Acceptable, but I need more. Show me depth and real insight.',
      chatty: "Oh wow, that's fascinating! Tell me everything - I want to hear all the details!",
      empathetic: "I can hear that's important to you. Please feel comfortable sharing more."
    };
    return responses[p] || responses.neutral;
  };

  const generateFollowUpQuestion = () => {
    const followUps = {
      tough: 'What else do you have? I need to see more substance from you.',
      friendly: "What other experiences have shaped you? I'm really enjoying our conversation!",
      neutral: 'What additional points would you like to discuss? Please continue.',
      skeptical: "What other claims do you want to make? I'm still not fully convinced.",
      supportive: 'What other strengths or experiences would you like to share? You\'re doing great!',
      intimidating: 'Continue. I expect more depth and insight from you.',
      chatty: 'Ooh, what else? Tell me more stories! I love hearing about people\'s lives!',
      empathetic: 'Is there anything else on your mind? I\'m here to listen and support you.'
    };

    const followUpMessage = {
      sender: 'ai',
      text: followUps[personality] || followUps.neutral,
      timestamp: Date.now()
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, followUpMessage]);
    }, 3000);
  };

  const startListening = () => {
    if (!speechManager.isSupported()) {
      alert('Speech recognition is not supported in your browser. Please try typing your response instead.');
      return;
    }

    speechManager.startListening(
      (transcript, confidence) => {
        setCurrentInput(transcript);
        setIsListening(false);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        if (error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else {
          alert('Speech recognition error. Please try again or type your response.');
        }
      },
      () => {
        setIsListening(true);
      }
    );
  };

  const stopListening = () => {
    speechManager.stopListening();
    setIsListening(false);
  };

  const toggleAISpeech = () => {
    if (speechManager.isSpeaking()) {
      speechManager.stopSpeaking();
    }
    setIsAISpeaking(!isAISpeaking);
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentInput('');
    setFeedback(null);
    setSessionStats({
      messagesCount: 0,
      averageConfidence: 0,
      startTime: Date.now()
    });
    speechManager.stopSpeaking();
    speechManager.stopListening();
    setIsListening(false);

    // Reset AI engine feedback
    if (aiEngine.resetFeedback) {
      aiEngine.resetFeedback();
    }

    initializeConversation();
  };

  const getSessionDuration = () => {
    const duration = Date.now() - sessionStats.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Needs Work';
  };

  return (
    <div className="conversation-interface">
      {/* Real-time Feedback Panel - Fixed positioning */}
      <div className="realtime-feedback-overlay">
        <div className="realtime-feedback-panel">
          <div className="feedback-header-mini">
            <span className="feedback-title-mini">📊 Real-time Feedback</span>
            <span className="feedback-score-mini" style={{ color: getScoreColor(realtimeFeedback.confidence) }}>
              Score: {Math.round(realtimeFeedback.confidence)}/100
            </span>
          </div>

          {/* Confidence Level */}
          <div className="confidence-mini">
            <div className="confidence-label-mini">
              💪 Confidence Level: {getConfidenceLevel(realtimeFeedback.confidence)}
            </div>
            <div className="confidence-bar-mini">
              <div
                className="confidence-fill-mini"
                style={{
                  width: `${realtimeFeedback.confidence}%`,
                  backgroundColor: getScoreColor(realtimeFeedback.confidence)
                }}
              ></div>
            </div>
          </div>

          {/* Metrics */}
          <div className="metrics-mini">
            <div className="metric-item">
              <span className="metric-label">WORDS</span>
              <span className="metric-value">{realtimeFeedback.metrics.words}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">SENTENCES</span>
              <span className="metric-value">{realtimeFeedback.metrics.sentences}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">FILLERS</span>
              <span className="metric-value">{realtimeFeedback.metrics.fillers}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">QUESTIONS</span>
              <span className="metric-value">{realtimeFeedback.metrics.questions}</span>
            </div>
          </div>

          {/* Strengths Section */}
          {realtimeFeedback.strengths.length > 0 && (
            <div className="feedback-mini-section">
              <div className="feedback-mini-header">💚 Strengths ({realtimeFeedback.strengths.length})</div>
              <div className="feedback-mini-items">
                {realtimeFeedback.strengths.slice(0, 3).map((strength, index) => (
                  <div key={index} className="feedback-mini-item strength">
                    ✓ {strength}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas to Improve Section */}
          {realtimeFeedback.areasToImprove.length > 0 && (
            <div className="feedback-mini-section">
              <div className="feedback-mini-header">⚠️ Areas to Improve ({realtimeFeedback.areasToImprove.length})</div>
              <div className="feedback-mini-items">
                {realtimeFeedback.areasToImprove.slice(0, 3).map((area, index) => (
                  <div key={index} className="feedback-mini-item improve">
                    → {area}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="conversation-header">
        <div className="header-left">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="scenario-info">
            <h2>{scenario.title}</h2>
            <span className="personality-tag">AI: {personality}</span>
            <span className="personality-tag" style={{ marginLeft: 8 }}>
              Level: {levelLabel[selectedLevel] || 'Beginner'}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="session-stats">
            <span>⏱️ {getSessionDuration()}</span>
            <span>💬 {sessionStats.messagesCount}</span>
            <span>📊 {Math.round(sessionStats.averageConfidence)}%</span>
          </div>
          <button onClick={() => setShowTips(!showTips)} className={`tips-btn ${showTips ? 'active' : ''}`}>
            <Lightbulb size={20} />
          </button>
          <button onClick={resetConversation} className="reset-btn">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {showTips && (
        <div className="tips-panel">
          <h4>💡 Quick Tips</h4>
          <ul>
            <li>
              Use <strong>Ctrl+Enter</strong> to send messages
            </li>
            <li>
              Use <strong>Ctrl+Space</strong> to toggle voice input
            </li>
            <li>
              Use <strong>Ctrl+M</strong> to toggle AI speech
            </li>
            <li>Be specific and use examples in your responses</li>
            <li>Practice maintaining eye contact (even with the screen!)</li>
            <li>Speak clearly and avoid filler words</li>
            <li>Watch the real-time feedback panel for instant tips!</li>
          </ul>
        </div>
      )}

      <div className="conversation-content">
        <div className="messages-section">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-content">{message.text}</div>
                <div className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {feedback && (
          <FeedbackPanel
            feedback={feedback}
            conversationHistory={messages}
            scenario={scenario}
            personality={personality}
            isVisible={true}
            onRetry={resetConversation}   // wired: retry
            onNext={onBack}               // wired: go back to selector / next step
          />
        )}
      </div>

      <div className="input-area">
        <div className="input-controls">
          <textarea
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Type your response here, or use the microphone..."
            className={isListening ? 'listening' : ''}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <div className="voice-controls">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              disabled={isLoading}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff /> : <Mic />}
            </button>

            <button
              onClick={toggleAISpeech}
              className={`speech-btn ${isAISpeaking ? 'active' : ''}`}
              title={isAISpeaking ? 'Disable AI speech' : 'Enable AI speech'}
            >
              {isAISpeaking ? <Volume2 /> : <VolumeX />}
            </button>
          </div>
        </div>

        <div className="input-footer">
          <div className="input-hints">
            {isListening && <span className="listening-indicator">🎤 Listening... Speak now</span>}
            {currentInput.length > 0 && (
              <span className="word-count">{currentInput.split(' ').filter((w) => w).length} words</span>
            )}
          </div>

          <button onClick={handleSendMessage} disabled={!currentInput.trim() || isLoading} className="send-btn">
            <Send size={20} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInterface;
