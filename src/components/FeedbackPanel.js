import React, { useState, useMemo } from 'react';
import { BarChart3, CheckCircle, Lightbulb } from 'lucide-react';

const FeedbackPanel = ({
  feedback,
  conversationHistory = [],
  scenario = null,
  personality = null,
  isVisible = true,
  onRetry = () => {},
  onNext = () => {}
}) => {
  // Hooks must run unconditionally
  const [expandedSection, setExpandedSection] = useState(null);

  // Compute a user-friendly score that blends confidence & analyzer score
  const blendedScore = useMemo(() => {
    const conf = Math.max(0, Math.min(100, feedback?.confidence ?? 0));
    const analyzer = Math.max(0, Math.min(100, feedback?.overallScore ?? conf));
    // Confidence is weighted higher to match user intuition
    return Math.round(0.6 * conf + 0.4 * analyzer);
  }, [feedback]);

  // Build richer improvement suggestions
  const enrichedSuggestions = useMemo(() => {
    const safeFeedback = feedback || {
      suggestions: [],
      metrics: {},
      overallScore: 0,
      confidence: 0,
      strengths: [],
      rawText: ''
    };

    const tips = new Set(safeFeedback.suggestions || []);
    const m = safeFeedback.metrics || {};
    const raw = safeFeedback.rawText || '';

    if ((m.wordCount ?? 0) < 20) {
      tips.add('Add more detail — aim for 3–5 sentences with one concrete example.');
    }
    if ((m.wordCount ?? 0) > 120) {
      tips.add('Be more concise — summarize your main point in 1–2 sentences.');
    }
    if (
      !/\b(first|second|also|because|therefore|however|finally|in conclusion|to summarize)\b/i.test(
        raw
      )
    ) {
      tips.add('Use signposts (e.g., “first…”, “because…”, “for example…”) to improve structure.');
    }
    if (!/\b(for example|for instance|such as|when i|i once|one time|specifically)\b/i.test(raw)) {
      tips.add('Support a claim with a quick example or number (impact, timeline, metric).');
    }
    if ((m.questionsAsked ?? 0) === 0) {
      tips.add('Ask at least one question to keep the conversation two‑way.');
    }
    if ((m.fillerWordCount ?? 0) > 1) {
      tips.add('Pause briefly instead of saying fillers like “um/uh/like”.');
    }
    if ((m.averageWordsPerSentence ?? 0) > 24) {
      tips.add('Split long sentences — one idea per sentence improves clarity.');
    }
    if (!/\b(i will|i can|i have|i am|definitely|certainly|confident|sure)\b/i.test(raw)) {
      tips.add('Use confident phrasing (e.g., “I can…”, “I’m confident that…”).');
    }

    if (scenario?.key === 'jobInterview') {
      tips.add('Use the STAR format (Situation, Task, Action, Result) for interview answers.');
    }
    if (scenario?.key === 'networking') {
      tips.add('Mirror & volley: share a point, then ask a related question back.');
    }
    if (scenario?.key === 'conflict') {
      tips.add('Use “I” statements and propose one clear next step to resolve.');
    }
    if (scenario?.key === 'publicSpeaking') {
      tips.add('Lead with a headline sentence, then give one supporting fact.');
    }

    return Array.from(tips);
  }, [feedback, scenario]);

  // After hooks, we can safely early-return
  if (!feedback || !isVisible) return null;

  const toggleSection = (section) =>
    setExpandedSection((cur) => (cur === section ? null : section));

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#2ed573';
    if (confidence >= 60) return '#ffa502';
    if (confidence >= 40) return '#ff6b35';
    return '#ff4757';
  };

  const getScoreClass = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'needs-improvement';
  };

  const score = blendedScore;

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <div className="feedback-title">
          <BarChart3 size={20} />
          <h4>Real-time Feedback</h4>
        </div>
        <div className="overall-score">
          <span className="score-label">Score:</span>
          <span className={`score ${getScoreClass(score)}`}>{score}/100</span>
        </div>
      </div>

      <div className="feedback-content">
        {/* Confidence Section */}
        <div className="feedback-section confidence-section">
          <div className="confidence-header">
            <span>💪 Confidence Level: {feedback.confidence}%</span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${feedback.confidence}%`,
                backgroundColor: getConfidenceColor(feedback.confidence)
              }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="feedback-section metrics-section">
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">WORDS</span>
              <span className="metric-value">{feedback.metrics.wordCount}</span>
              <span className="metric-status">
                {feedback.metrics.wordCount >= 20 && feedback.metrics.wordCount <= 80 ? '✓' : '!'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">SENTENCES</span>
              <span className="metric-value">{feedback.metrics.sentenceCount}</span>
              <span className="metric-status">
                {feedback.metrics.sentenceCount >= 2 ? '✓' : '!'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">FILLERS</span>
              <span className="metric-value">{feedback.metrics.fillerWordCount}</span>
              <span className="metric-status">
                {feedback.metrics.fillerWordCount <= 1 ? '✓' : '!'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">QUESTIONS</span>
              <span className="metric-value">{feedback.metrics.questionsAsked}</span>
              <span className="metric-status">
                {feedback.metrics.questionsAsked > 0 ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="feedback-section strengths-section">
            <div className="section-header clickable" onClick={() => toggleSection('strengths')}>
              <h5>✅ Strengths ({feedback.strengths.length})</h5>
              <div className="expand-icon">{expandedSection === 'strengths' ? '−' : '+'}</div>
            </div>
            {(expandedSection === 'strengths' || feedback.strengths.length <= 2) && (
              <div className="section-content">
                <ul className="strengths-list">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="strength-item">
                      <CheckCircle className="strength-icon" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {enrichedSuggestions.length > 0 && (
          <div className="feedback-section suggestions-section">
            <div className="section-header clickable" onClick={() => toggleSection('suggestions')}>
              <h5>💡 Areas to Improve ({enrichedSuggestions.length})</h5>
              <div className="expand-icon">{expandedSection === 'suggestions' ? '−' : '+'}</div>
            </div>
            {(expandedSection === 'suggestions' || enrichedSuggestions.length <= 2) && (
              <div className="section-content">
                <ul className="suggestions-list">
                  {enrichedSuggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item">
                      <Lightbulb className="suggestion-icon" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Encouragement */}
        <div className="feedback-section encouragement-section">
          <div className="encouragement">
            <div className="encouragement-icon">
              {score >= 90 ? '🌟' : score >= 70 ? '👍' : score >= 50 ? '💪' : '🚀'}
            </div>
            <p>{getDefaultEncouragement(score)}</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="feedback-section cta-section">
          {score < 90 ? (
            <>
              <button className="retry-btn" onClick={onRetry}>↻ Retry this scenario</button>
              <p className="cta-hint">Aim for 90+ before moving on. Use the tips above on your next try.</p>
            </>
          ) : (
            <>
              <button className="next-btn" onClick={onNext}>✅ Try another scenario / harder level</button>
              <p className="cta-hint">Nice work! Level up the challenge or switch scenarios.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getDefaultEncouragement = (score) => {
  if (score >= 90) return "Outstanding! You’re ready to raise the difficulty or try a new scenario.";
  if (score >= 70) return "Great job! You’re close — a little polish and you’ll be at mastery.";
  if (score >= 50) return "Good progress! Focus on the improvement tips and try again.";
  return "You're just getting started! Every practice boosts your confidence — give it another go.";
};

export default FeedbackPanel;
