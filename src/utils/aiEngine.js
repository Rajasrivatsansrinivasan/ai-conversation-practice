// src/utils/aiEngine.js

/**
 * AIConversationEngine
 * - Calls your Vercel serverless proxy at /api/chat (keeps GROQ_API_KEY private)
 * - Maintains real-time, lightweight text analysis for live feedback
 * - Provides robust fallbacks if the network/model is unavailable
 *
 * If you want to switch models at runtime, call aiEngine.updateModel('<model-name>')
 */

class AIConversationEngine {
  constructor() {
    this.initialized = true;

    // IMPORTANT: Do NOT store API keys here.
    // The browser calls the serverless proxy only:
    // - In production: '/api/chat'
    // - In development: you can also point to '/api/chat' if running Vercel dev,
    //   or override with REACT_APP_GROQ_DEV_PROXY.
    this.baseURL =
      process.env.NODE_ENV === 'development'
        ? (process.env.REACT_APP_GROQ_DEV_PROXY || '/api/chat')
        : '/api/chat';

    // Model is configurable via env; can be updated at runtime
    this.model =
      process.env.REACT_APP_GROQ_MODEL ||
      'llama3-70b-8192';

    // Real-time feedback system (lightweight, client-side)
    this.feedbackCallbacks = [];
    this.currentFeedback = {
      strengths: [],
      areasToImprove: [],
      confidence: 85,
      metrics: {
        words: 0,
        sentences: 0,
        fillers: 0,
        questions: 0
      }
    };
  }

  async initialize() {
    console.log('AI Engine ready (proxy mode) and Real-time Feedback enabled');
    return Promise.resolve();
  }

  /* =========================
     REAL-TIME FEEDBACK SYSTEM
     ========================= */

  onFeedbackUpdate(callback) {
    this.feedbackCallbacks.push(callback);
  }

  removeFeedbackCallback(callback) {
    this.feedbackCallbacks = this.feedbackCallbacks.filter(cb => cb !== callback);
  }

  notifyFeedbackUpdate() {
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback({ ...this.currentFeedback });
      } catch (error) {
        console.error('Error in feedback callback:', error);
      }
    });
  }

  analyzeUserInput(userInput, conversationHistory = []) {
    if (!userInput || !userInput.trim()) return;

    const analysis = this.performTextAnalysis(userInput);

    this.currentFeedback.metrics = {
      words: analysis.wordCount,
      sentences: analysis.sentenceCount,
      fillers: analysis.fillerCount,
      questions: analysis.questionCount
    };

    this.updateFeedback(userInput, conversationHistory, analysis);
    this.notifyFeedbackUpdate();
  }

  performTextAnalysis(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const fillers =
      (text.toLowerCase().match(/\b(um|uh|like|you know|basically|actually|well|so|right)\b/g) || [])
        .length;
    const questions = (text.match(/\?/g) || []).length;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      fillerCount: fillers,
      questionCount: questions,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0
    };
  }

  updateFeedback(userInput, conversationHistory, analysis) {
    const newStrengths = [];
    const newAreasToImprove = [];

    // Length / level of detail
    if (analysis.wordCount >= 20) {
      newStrengths.push('Providing comprehensive responses');
    } else if (analysis.wordCount >= 10) {
      newStrengths.push('Good response length');
    } else if (analysis.wordCount < 5 && analysis.wordCount > 0) {
      newAreasToImprove.push('Expand on your answers with more detail');
    }

    // Filler words
    if (analysis.fillerCount === 0 && analysis.wordCount > 10) {
      newStrengths.push('Clear speech without filler words');
    } else if (analysis.fillerCount > 3) {
      newAreasToImprove.push('Reduce filler words (um, uh, like, you know)');
    } else if (analysis.fillerCount > 1) {
      newAreasToImprove.push('Try to minimize filler words');
    }

    // Sentence structure
    if (analysis.avgWordsPerSentence > 8 && analysis.avgWordsPerSentence < 20) {
      newStrengths.push('Well-structured sentence length');
    } else if (analysis.avgWordsPerSentence > 25) {
      newAreasToImprove.push('Break down complex sentences for clarity');
    }

    // Engagement
    if (analysis.questionCount > 0) {
      newStrengths.push('Asking engaging questions');
    }

    // Confidence cues
    const confidenceWords = userInput
      .toLowerCase()
      .match(/\b(confident|sure|certain|believe|strong|definitely|absolutely|clearly)\b/g);
    if (confidenceWords && confidenceWords.length > 0) {
      newStrengths.push('Expressing confidence in responses');
    }

    const uncertainWords = userInput
      .toLowerCase()
      .match(/\b(maybe|perhaps|might|not sure|i think|i guess|probably)\b/g);
    if (uncertainWords && uncertainWords.length > 2) {
      newAreasToImprove.push('Show more confidence in your responses');
    }

    // Examples / specific details
    if (
      userInput.toLowerCase().includes('for example') ||
      userInput.toLowerCase().includes('such as') ||
      userInput.toLowerCase().includes('for instance')
    ) {
      newStrengths.push('Supporting points with examples');
    } else if (analysis.wordCount > 25) {
      newAreasToImprove.push('Include specific examples to support your points');
    }

    // Personal experience cues
    if (userInput.toLowerCase().match(/\b(when i|i remember|last time|recently|yesterday|during)\b/g)) {
      newStrengths.push('Using personal experiences effectively');
    }

    // Action words / professional tone
    if (userInput.toLowerCase().match(/\b(achieved|implemented|developed|managed|led|improved|increased)\b/g)) {
      newStrengths.push('Using professional action words');
    }

    // Organization cues
    if (userInput.toLowerCase().match(/\b(first|second|third|finally|in conclusion|to summarize)\b/g)) {
      newStrengths.push('Well-organized response structure');
    }

    // Merge (unique) and clamp lists
    this.currentFeedback.strengths = [
      ...new Set([...this.currentFeedback.strengths, ...newStrengths])
    ].slice(0, 6);

    this.currentFeedback.areasToImprove = [
      ...new Set([...this.currentFeedback.areasToImprove, ...newAreasToImprove])
    ].slice(0, 6);

    // Confidence score adjustments (bounded change per message)
    let confidenceAdjustment = 0;
    if (analysis.fillerCount === 0 && analysis.wordCount > 5) confidenceAdjustment += 3;
    if (analysis.wordCount >= 15) confidenceAdjustment += 2;
    if (confidenceWords && confidenceWords.length > 0) confidenceAdjustment += 4;
    if (analysis.questionCount > 0) confidenceAdjustment += 2;
    if (userInput.toLowerCase().includes('for example')) confidenceAdjustment += 3;

    if (analysis.fillerCount > 3) confidenceAdjustment -= 8;
    if (analysis.fillerCount > 1) confidenceAdjustment -= 3;
    if (analysis.wordCount < 5) confidenceAdjustment -= 5;
    if (uncertainWords && uncertainWords.length > 2) confidenceAdjustment -= 4;

    const maxChange = 5;
    confidenceAdjustment = Math.max(-maxChange, Math.min(maxChange, confidenceAdjustment));

    this.currentFeedback.confidence = Math.max(
      0,
      Math.min(100, this.currentFeedback.confidence + confidenceAdjustment)
    );
  }

  getCurrentFeedback() {
    return { ...this.currentFeedback };
  }

  resetFeedback() {
    this.currentFeedback = {
      strengths: [],
      areasToImprove: [],
      confidence: 85,
      metrics: {
        words: 0,
        sentences: 0,
        fillers: 0,
        questions: 0
      }
    };
    this.notifyFeedbackUpdate();
  }

  /* =========================
     AI RESPONSE GENERATION
     ========================= */

  async generateResponse(userInput, personality, scenario, conversationHistory = []) {
    // Kick off the lightweight real-time analysis (non-blocking)
    if (userInput && userInput.trim()) {
      setTimeout(() => {
        try {
          this.analyzeUserInput(userInput, conversationHistory);
        } catch (e) {
          console.warn('Realtime feedback analysis failed (non-blocking):', e);
        }
      }, 0);
    }

    try {
      const response = await this.callProxyAPI(userInput, personality, scenario, conversationHistory);
      return response;
    } catch (error) {
      console.error('Proxy API call failed, using fallback:', error);
      return this.getFallbackResponse(userInput, personality, scenario, conversationHistory);
    }
  }

  async callProxyAPI(userInput, personality, scenario, conversationHistory) {
    const systemPrompt = this.buildSystemPrompt(personality, scenario);
    const messages = this.buildMessages(systemPrompt, userInput, conversationHistory);

    const requestBody = {
      model: this.model,
      messages,
      max_tokens: 200,
      temperature: 0.8,
      top_p: 0.9,
      stream: false
    };

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Surface the server error to help with debugging
      const text = await response.text();
      throw new Error(text || 'Proxy responded with an error');
    }

    const data = await response.json();

    // Expected OpenAI-compatible shape
    if (data?.choices?.[0]?.message?.content) {
      return String(data.choices[0].message.content).trim();
    }

    throw new Error('Invalid response format from proxy');
  }

  buildSystemPrompt(personality, scenario) {
    const personalityPrompts = {
      tough:
        'You are a tough, demanding interviewer. Be critical, skeptical, and hard to impress. Ask challenging follow-up questions. Keep responses under 60 words.',
      friendly:
        'You are warm, friendly, and encouraging. Show genuine interest and be supportive. Ask engaging questions. Keep responses under 60 words.',
      neutral:
        'You are professional and business-focused. Be direct, formal, and stick to relevant topics. Keep responses under 60 words.',
      skeptical:
        'You are skeptical and questioning. Challenge what people say and ask for evidence. Be doubtful but not rude. Keep responses under 60 words.',
      supportive:
        'You are a supportive mentor. Provide encouragement and helpful suggestions. Be understanding and positive. Keep responses under 60 words.',
      intimidating:
        "You are stern and authoritative. Expect high standards and don't accept mediocrity. Be formal and demanding. Keep responses under 60 words.",
      chatty:
        'You are talkative and enthusiastic. Ask lots of questions and show great interest. Be energetic and social. Keep responses under 60 words.',
      empathetic:
        'You are understanding and emotionally aware. Show empathy and validate feelings. Be compassionate and caring. Keep responses under 60 words.'
    };

    const scenarioContext = scenario
      ? `You are in a ${scenario.title} scenario. ${scenario.description}`
      : '';

    const personalityDesc =
      personalityPrompts[personality] || personalityPrompts.neutral;

    return `${personalityDesc} ${scenarioContext} Respond naturally and conversationally. Focus on helping the person practice their communication skills.`;
  }

  buildMessages(systemPrompt, userInput, conversationHistory) {
    const messages = [{ role: 'system', content: systemPrompt }];

    // include only the recent turns to keep prompt lean
    const recentHistory = (conversationHistory || []).slice(-12);
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'ai') {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    if (userInput && userInput.trim()) {
      messages.push({ role: 'user', content: userInput });
    }

    return messages;
  }

  /* =========================
     FALLBACK RESPONSES
     (Used if proxy/model fails)
     ========================= */

  getFallbackResponse(userInput, personality, scenario, conversationHistory) {
    const input = (userInput || '').toLowerCase();
    const messageCount = (conversationHistory || []).filter(m => m.sender === 'user').length + 1;

    if (messageCount === 1 || !userInput) {
      return this.getOpeningResponse(personality, scenario);
    }

    if (this.hasKeywords(input, ['experience', 'worked', 'job', 'career', 'background'])) {
      return this.getExperienceResponse(personality);
    }
    if (this.hasKeywords(input, ['strength', 'good at', 'skills', 'best', 'excel'])) {
      return this.getStrengthResponse(personality);
    }
    if (this.hasKeywords(input, ['weakness', 'improve', 'challenge', 'difficult', 'struggle'])) {
      return this.getWeaknessResponse(personality);
    }
    if (this.hasKeywords(input, ['team', 'people', 'colleague', 'group', 'collaboration'])) {
      return this.getTeamResponse(personality);
    }
    if (this.hasKeywords(input, ['why', 'because', 'reason', 'motivated', 'interest'])) {
      return this.getWhyResponse(personality);
    }
    if (this.hasKeywords(input, ['goal', 'future', 'plan', 'aspiration', 'vision'])) {
      return this.getGoalResponse(personality);
    }

    return this.getGeneralResponse(personality);
  }

  hasKeywords(input, keywords) {
    return keywords.some(k => input.includes(k));
  }

  getOpeningResponse(personality, scenario) {
    const responses = {
      tough: {
        jobInterview:
          "Let's cut to the chase. Tell me why you think you're qualified for this position, and don't give me generic answers.",
        networking:
          "I don't have much time. What exactly do you do, and why should I care?",
        conflict:
          'We have a serious issue to address. What is your explanation for this situation?',
        default:
          "I expect direct, honest answers. What do you have to show me that's actually impressive?"
      },
      friendly: {
        jobInterview:
          'Welcome! I’m excited to learn about you. How are you feeling about this opportunity, and what drew you here?',
        networking:
          "Hi there! What a wonderful event. I'd love to hear about your work — what's been exciting you lately?",
        conflict:
          'Thanks for sitting down with me. I believe we can work through this together. What’s your perspective?',
        default:
          'Hello! This is going to be a great conversation. Tell me what’s been on your mind lately!'
      },
      neutral: {
        jobInterview:
          'Thank you for coming in. Please walk me through your background and explain your interest in this role.',
        networking:
          'Good to meet you. What line of work are you in, and what brings you to this event?',
        conflict:
          'Let’s discuss the situation objectively. What’s your perspective on what happened?',
        default:
          'Let’s begin. Please share your thoughts on this topic and provide some context.'
      },
      skeptical: {
        jobInterview:
          "I've seen many candidates today. What makes you different from everyone else?",
        networking:
          'Everyone here claims to be successful. What results can you point me to?',
        conflict:
          "I'm hearing conflicting stories. Why should I believe your version over others?",
        default:
          "I'm naturally skeptical of claims. What evidence can you provide to support your position?"
      },
      supportive: {
        jobInterview:
          'I want you to feel comfortable sharing your story. What drew you to this role, and how can I help you shine?',
        networking:
          'You seem like someone with interesting experiences. I’d love to hear your journey — take your time.',
        conflict:
          'I can see this might be difficult to discuss. Share what happened from your perspective; we’ll work through it.',
        default:
          'I’m here to listen and help. What would you like to share, and how can I support you?'
      }
    };

    const personalityGroup = responses[personality] || responses.neutral;

    // If scenario has a key, try a keyed response; otherwise default
    const scenarioKey = scenario?.key;
    if (scenarioKey && personalityGroup[scenarioKey]) {
      return personalityGroup[scenarioKey];
    }
    return personalityGroup.default;
  }

  getExperienceResponse(personality) {
    const responses = {
      tough: [
        'That’s what everyone says. Give me specific numbers and measurable outcomes.',
        'Experience means nothing without results. What did you actually achieve?'
      ],
      friendly: [
        'That sounds valuable! What was the most rewarding part, and what did you learn?',
        'How exciting! Which skills did you develop, and how will you use them next?'
      ],
      neutral: [
        'Can you quantify the impact you made in that role?',
        'What were your key responsibilities and how did you measure success?'
      ],
      skeptical: [
        'Anyone can claim experience. What proof do you have of performance?',
        'That sounds embellished. What were the measurable outcomes?'
      ],
      supportive: [
        'It sounds like you gained valuable insights from that experience.',
        'You’re clearly dedicated to growth. How did that shape your perspective?'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getStrengthResponse(personality) {
    const responses = {
      tough: [
        'Everyone thinks they have strengths. Prove it with a specific example.',
        'Show me how that strength delivered business value.'
      ],
      friendly: [
        'That’s wonderful! How do you use that strength to help others?',
        'Great! Can you share a specific example of it in action?'
      ],
      neutral: [
        'How have you leveraged that strength to achieve goals?',
        'Can you provide a specific example with measurable outcomes?'
      ],
      skeptical: [
        'Self‑proclaimed strengths can hide weaknesses. Convince me.',
        'I’m skeptical of overconfidence. What’s the evidence?'
      ],
      supportive: [
        'That’s a great strength to have. You should be confident in it!',
        'It’s great that you recognize your strengths. How will you grow them further?'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getWeaknessResponse(personality) {
    const responses = {
      tough: [
        'At least you’re honest. How are you fixing it, and on what timeline?',
        'Weaknesses are liabilities. What’s your concrete plan to improve?'
      ],
      friendly: [
        'Thanks for being honest. How are you working on that area?',
        'It takes courage to acknowledge weaknesses. What’s your plan?'
      ],
      neutral: [
        'What specific actions are you taking to address that?',
        'How has it impacted you, and how are you mitigating it?'
      ],
      skeptical: [
        'Sounds like a strength in disguise. What’s your real weakness?',
        'I doubt that’s the biggest one. What else should I know?'
      ],
      supportive: [
        'Recognizing weaknesses is the first step to growth.',
        'We all have areas to improve — you’re on the right track.'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getTeamResponse(personality) {
    const responses = {
      tough: [
        'Teamwork is expected. What did YOU specifically contribute?',
        'I don’t care about the team’s success — what was your impact?'
      ],
      friendly: [
        'Collaboration is so important! What do you enjoy about team work?',
        'Teams do amazing things. How do you help them succeed?'
      ],
      neutral: [
        'What role did you play in that team?',
        'How do you contribute to team success and resolve conflict?'
      ],
      skeptical: [
        'Team success often hides individual failures. What went wrong?',
        'Easy to claim team results — what was your contribution?'
      ],
      supportive: [
        'Collaboration skills are valuable. Well done!',
        'You clearly understand how to work with others effectively.'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getWhyResponse(personality) {
    const responses = {
      tough: [
        'That’s a weak reason. What’s the deeper motivation?',
        'I’ve heard that before. What’s really driving you?'
      ],
      friendly: [
        'That’s thoughtful! What sparked that interest?',
        'I can hear the passion — how did it start?'
      ],
      neutral: [
        'What factors led to that decision?',
        'What research informed that perspective?'
      ],
      skeptical: [
        'Sounds like what you think I want to hear. What’s the truth?',
        'I’m not convinced. Explain the real reason.'
      ],
      supportive: [
        'That shows real reflection. Nice!',
        'You’ve clearly considered this carefully.'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getGoalResponse(personality) {
    const responses = {
      tough: [
        'Goals are worthless without execution. What’s your track record?',
        'Everyone has goals. What makes you think you’ll hit yours?'
      ],
      friendly: [
        'That’s exciting! What steps are you taking?',
        'Great aspiration! How can I support you?'
      ],
      neutral: [
        'What’s your timeline and key milestones?',
        'What obstacles do you anticipate and how will you handle them?'
      ],
      skeptical: [
        'Popular goal — what makes your approach different?',
        'I’ve heard that a lot. How will you avoid common pitfalls?'
      ],
      supportive: [
        'Meaningful goal — you should be proud!',
        'You seem determined; what’s the next step?'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  getGeneralResponse(personality) {
    const responses = {
      tough: [
        'Not enough. Give me something more substantial.',
        'I need results, not just effort. What did you accomplish?'
      ],
      friendly: [
        'That’s interesting! Can you share more?',
        'I love your perspective. What else would you add?'
      ],
      neutral: [
        'Can you elaborate with concrete examples?',
        'What factors led you to that conclusion?'
      ],
      skeptical: [
        'Hard to believe — what’s the evidence?',
        'That contradicts the norm. What’s different here?'
      ],
      supportive: [
        'You’re handling this well — thoughtful!',
        'You’ve clearly considered this. Nicely done!'
      ]
    };
    const options = responses[personality] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }

  /* =========================
     UTILITIES
     ========================= */

  isReady() {
    return this.initialized;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      model: this.model,
      feedbackCallbacksCount: this.feedbackCallbacks.length,
      currentConfidence: this.currentFeedback.confidence,
      proxyURL: this.baseURL
    };
  }

  updateModel(newModel) {
    if (typeof newModel === 'string' && newModel.trim()) {
      this.model = newModel.trim();
      console.log(`AI model updated to: ${this.model}`);
    }
  }

  getConversationStats(conversationHistory) {
    const userMessages = (conversationHistory || []).filter(msg => msg.sender === 'user');
    const totalWords = userMessages.reduce((sum, msg) => {
      return sum + (msg.text ? msg.text.trim().split(/\s+/).length : 0);
    }, 0);

    const avgWordsPerMessage =
      userMessages.length > 0 ? totalWords / userMessages.length : 0;

    return {
      totalMessages: userMessages.length,
      totalWords,
      averageWordsPerMessage: Math.round(avgWordsPerMessage),
      conversationDuration:
        (conversationHistory && conversationHistory.length > 0)
          ? Date.now() - conversationHistory[0].timestamp
          : 0
    };
  }

  generateConversationSummary(conversationHistory) {
    const stats = this.getConversationStats(conversationHistory);
    const feedback = this.getCurrentFeedback();

    return {
      stats,
      feedback,
      strengths: feedback.strengths,
      areasToImprove: feedback.areasToImprove,
      overallScore: feedback.confidence,
      recommendations: this.generateRecommendations(feedback, stats)
    };
  }

  generateRecommendations(feedback, stats) {
    const recs = [];

    if (feedback.confidence < 70) {
      recs.push('Practice expressing your ideas with more confidence and conviction.');
    }
    if (stats.averageWordsPerMessage < 10) {
      recs.push('Provide more detailed responses with specific examples.');
    }
    if (feedback.metrics.fillers > 0) {
      recs.push("Reduce filler words by pausing instead of saying 'um' or 'uh'.");
    }
    if (feedback.areasToImprove.length > feedback.strengths.length) {
      recs.push('Balance growth: build your strengths while addressing key gaps.');
    }
    if (stats.totalMessages < 5) {
      recs.push('Aim for longer practice sessions to build flow and comfort.');
    }

    return recs;
  }

  exportConversationData(conversationHistory) {
    const summary = this.generateConversationSummary(conversationHistory);
    const exportData = {
      timestamp: new Date().toISOString(),
      conversationHistory,
      summary,
      finalFeedback: this.getCurrentFeedback()
    };
    return JSON.stringify(exportData, null, 2);
  }

  debugLog() {
    console.log('AI Engine Debug Info:', {
      status: this.getStatus(),
      currentFeedback: this.getCurrentFeedback(),
      callbacksRegistered: this.feedbackCallbacks.length
    });
  }
}

const aiEngine = new AIConversationEngine();
aiEngine.initialize().catch(console.error);

export default aiEngine;
