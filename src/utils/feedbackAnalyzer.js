class FeedbackAnalyzer {
  analyzeResponse(userText, scenario = null, personality = null) {
    const feedback = {
      confidence: this.calculateConfidence(userText),
      wordCount: userText.split(' ').filter(word => word.length > 0).length,
      suggestions: [],
      strengths: [],
      metrics: this.calculateMetrics(userText),
      overallScore: 0
    };

    // Analyze confidence markers
    if (this.hasFillerWords(userText)) {
      feedback.suggestions.push("Try to reduce filler words like 'um', 'uh', 'like'");
    } else {
      feedback.strengths.push("Clear speech with minimal filler words");
    }

    // Analyze assertiveness
    if (this.isAssertive(userText)) {
      feedback.strengths.push("Confident and assertive tone");
    } else {
      feedback.suggestions.push("Try to sound more confident - avoid phrases like 'I think maybe'");
    }

    // Analyze length
    if (userText.split(' ').length < 10) {
      feedback.suggestions.push("Try to elaborate more on your answers");
    } else if (userText.split(' ').length > 100) {
      feedback.suggestions.push("Try to be more concise in your responses");
    } else {
      feedback.strengths.push("Good response length");
    }

    // Analyze specificity
    if (this.isSpecific(userText)) {
      feedback.strengths.push("Good use of specific examples and details");
    } else {
      feedback.suggestions.push("Try to include specific examples or details");
    }

    // Analyze positivity
    if (this.isPositive(userText)) {
      feedback.strengths.push("Positive and enthusiastic tone");
    }

    // Analyze clarity
    if (this.isClear(userText)) {
      feedback.strengths.push("Clear and well-structured response");
    } else {
      feedback.suggestions.push("Try to organize your thoughts more clearly");
    }

    // Scenario-specific feedback
    if (scenario) {
      const scenarioFeedback = this.getScenarioSpecificFeedback(userText, scenario);
      feedback.suggestions.push(...scenarioFeedback.suggestions);
      feedback.strengths.push(...scenarioFeedback.strengths);
    }

    // Calculate overall score
    feedback.overallScore = this.calculateOverallScore(feedback);

    return feedback;
  }

  calculateConfidence(text) {
    let score = 50; // Base score

    // Positive indicators
    if (/\b(definitely|certainly|confident|sure|absolutely|clearly)\b/i.test(text)) score += 20;
    if (!/\b(maybe|perhaps|might|possibly|I think|I guess)\b/i.test(text)) score += 15;
    if (!/\b(um|uh|like|you know|sort of|kind of)\b/i.test(text)) score += 10;
    if (/\b(I will|I can|I have|I am|I know)\b/i.test(text)) score += 10;

    // Negative indicators
    if (/\b(sorry|apologize)\b/i.test(text)) score -= 10;
    if (/\b(I don't know|not sure|uncertain|no idea)\b/i.test(text)) score -= 15;
    if ((text.match(/\?/g) || []).length > 2) score -= 10;
    if (text.split(' ').length < 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  calculateMetrics(text) {
    const words = text.split(' ').filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      fillerWordCount: this.countFillerWords(text),
      questionsAsked: (text.match(/\?/g) || []).length,
      exclamationCount: (text.match(/!/g) || []).length
    };
  }

  hasFillerWords(text) {
    const fillers = /\b(um|uh|like|you know|sort of|kind of|actually|basically|literally)\b/gi;
    const matches = text.match(fillers);
    const wordCount = text.split(' ').length;
    
    // More than 5% filler words is problematic
    return matches && (matches.length / wordCount) > 0.05;
  }

  countFillerWords(text) {
    const fillers = /\b(um|uh|like|you know|sort of|kind of|actually|basically|literally)\b/gi;
    const matches = text.match(fillers);
    return matches ? matches.length : 0;
  }

  isAssertive(text) {
    const assertiveWords = /\b(I will|I can|I have|I am|definitely|certainly|I believe|I know)\b/i;
    const tentativeWords = /\b(maybe|perhaps|I think|possibly|might|I guess|probably)\b/i;
    
    const hasAssertive = assertiveWords.test(text);
    const hasTentative = tentativeWords.test(text);
    
    return hasAssertive && !hasTentative;
  }

  isSpecific(text) {
    // Look for specific indicators: numbers, names, dates, concrete examples
    const specificIndicators = /\b(\d+|when I|for example|specifically|in particular|at \w+|during|last \w+)\b/i;
    const examples = /\b(for instance|such as|like when|one time)\b/i;
    
    return specificIndicators.test(text) || examples.test(text);
  }

  isPositive(text) {
    const positiveWords = /\b(great|excellent|wonderful|love|enjoy|excited|passionate|amazing|fantastic|good|happy)\b/i;
    const negativeWords = /\b(hate|terrible|awful|boring|difficult|problem|issue|struggle|hard|bad)\b/i;
    
    const positiveCount = (text.match(positiveWords) || []).length;
    const negativeCount = (text.match(negativeWords) || []).length;
    
    return positiveCount > negativeCount;
  }

  isClear(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(' ').filter(word => word.length > 0);
    
    // Check for reasonable sentence length and structure
    const averageWordsPerSentence = words.length / sentences.length;
    const hasTransitions = /\b(first|second|also|however|therefore|because|since|although)\b/i.test(text);
    
    return averageWordsPerSentence >= 5 && averageWordsPerSentence <= 25 && hasTransitions;
  }

  getScenarioSpecificFeedback(text, scenario) {
    const feedback = { suggestions: [], strengths: [] };
    
    switch (scenario.key) {
      case 'jobInterview':
        if (/\b(team|collaboration|leadership|results|achievement)\b/i.test(text)) {
          feedback.strengths.push("Good use of professional keywords");
        }
        if (!/\b(experience|skill|achievement|result)\b/i.test(text)) {
          feedback.suggestions.push("Try to highlight your relevant experience and achievements");
        }
        if (text.length < 50) {
          feedback.suggestions.push("Interview answers should be more detailed");
        }
        break;
        
      case 'networking':
        if (/\b(what about you|how about|tell me about)\b/i.test(text)) {
          feedback.strengths.push("Good reciprocal conversation skills");
        }
        if (!/\?/.test(text)) {
          feedback.suggestions.push("Try asking questions to keep the conversation flowing");
        }
        break;
        
      case 'conflict':
        if (/\b(understand|perspective|solution|resolve)\b/i.test(text)) {
          feedback.strengths.push("Shows willingness to understand and resolve issues");
        }
        if (/\b(you always|you never|your fault)\b/i.test(text)) {
          feedback.suggestions.push("Avoid accusatory language - use 'I' statements instead");
        }
        break;
        
      case 'customerService':
        if (/\b(understand|apologize|help|solve|resolution)\b/i.test(text)) {
          feedback.strengths.push("Professional customer service language");
        }
        if (!/\b(understand|help|apologize)\b/i.test(text)) {
          feedback.suggestions.push("Show empathy and willingness to help");
        }
        break;
        
      case 'publicSpeaking':
        if (/\b(research shows|studies indicate|data suggests)\b/i.test(text)) {
          feedback.strengths.push("Good use of evidence and data");
        }
        if (text.length < 30) {
          feedback.suggestions.push("Provide more substantial responses with supporting details");
        }
        break;
    }
    
    return feedback;
  }

  calculateOverallScore(feedback) {
    let score = feedback.confidence * 0.4; // 40% weight on confidence
    
    // Add points for strengths
    score += feedback.strengths.length * 10;
    
    // Subtract points for suggestions (areas needing improvement)
    score -= feedback.suggestions.length * 5;
    
    // Bonus for good metrics
    if (feedback.metrics.wordCount >= 20 && feedback.metrics.wordCount <= 80) {
      score += 10;
    }
    
    if (feedback.metrics.fillerWordCount === 0) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateEncouragement(feedback) {
    if (feedback.overallScore >= 80) {
      return "Excellent! You're communicating with confidence and clarity.";
    } else if (feedback.overallScore >= 60) {
      return "Good job! You're on the right track with some room for improvement.";
    } else if (feedback.overallScore >= 40) {
      return "You're making progress! Focus on the suggestions to improve further.";
    } else {
      return "Keep practicing! Every conversation is a chance to improve.";
    }
  }
}

export default new FeedbackAnalyzer();