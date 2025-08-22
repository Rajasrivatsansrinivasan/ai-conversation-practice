import React, { useState } from 'react';
import { scenarios, personalities } from '../data/scenarios'; // ← FIXED
import { Users, MessageCircle, Briefcase, Heart, Phone, Home, Mic } from 'lucide-react';

const ScenarioSelector = ({
  onScenarioSelect,
  onPersonalitySelect,
  onLevelSelect,
  selectedScenario,
  selectedPersonality,
  selectedLevel
}) => {
  const [localScenarioKey, setLocalScenarioKey] = useState(selectedScenario?.key || null);

  const handleScenarioClick = (key, scenario) => {
    setLocalScenarioKey(key);
    onScenarioSelect(key, scenario);
  };

  const handlePersonalityClick = (personalityKey) => {
    onPersonalitySelect(personalityKey);
  };

  const handleLevelClick = (levelKey) => {
    onLevelSelect(levelKey);
  };

  const getScenarioIcon = (scenarioKey) => {
    const iconMap = {
      jobInterview: <Briefcase className="scenario-icon" />,
      networking: <Users className="scenario-icon" />,
      conflict: <MessageCircle className="scenario-icon" />,
      dating: <Heart className="scenario-icon" />,
      customerService: <Phone className="scenario-icon" />,
      familyConflict: <Home className="scenario-icon" />,
      publicSpeaking: <Mic className="scenario-icon" />,
      socialAnxiety: <Users className="scenario-icon" />
    };
    return iconMap[scenarioKey] || <MessageCircle className="scenario-icon" />;
  };

  const levels = {
    Beginner: {
      emoji: '🌱',
      blurb: 'Gentle pace, simpler prompts, more guidance',
      color: '#2ed573'
    },
    Intermediate: {
      emoji: '🚶‍♂️',
      blurb: 'Moderate difficulty, balanced feedback',
      color: '#ffa502'
    },
    Advanced: {
      emoji: '🏃‍♀️',
      blurb: 'Challenging, fast-paced, tougher follow-ups',
      color: '#ff4757'
    }
  };

  const scenarioChosen = Boolean(selectedScenario || localScenarioKey);
  const personalityChosen = Boolean(selectedPersonality);

  return (
    <div className="scenario-selector">
      {/* STEP 1: Choose Scenario */}
      <div className="selector-section">
        <h2>🎯 Choose Your Practice Scenario</h2>
        <p className="section-description">
          Select the type of conversation you'd like to practice. Each scenario will present you with realistic situations and responses.
        </p>

        <div className="scenarios-grid">
          {Object.entries(scenarios).map(([key, scenario]) => (
            <div
              key={key}
              className={`scenario-card ${(selectedScenario?.key || localScenarioKey) === key ? 'selected' : ''}`}
              onClick={() => handleScenarioClick(key, scenario)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleScenarioClick(key, scenario)}
            >
              <div className="card-header">
                {getScenarioIcon(key)}
              </div>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
              <div className="scenario-preview">
                <small>Sample questions:</small>
                <ul>
                  {scenario.questions.slice(0, 2).map((question, index) => (
                    <li key={index}>"{question}"</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2: Choose Personality */}
      <div className="selector-section">
        <h2>🤖 Choose AI Personality</h2>
        <p className="section-description">
          Select how you want the AI to behave during your practice session. Different personalities will challenge you in different ways.
        </p>

        <div className="personality-grid">
          {Object.entries(personalities).map(([key, personality]) => (
            <div
              key={key}
              className={`personality-card ${selectedPersonality === key ? 'selected' : ''}`}
              onClick={() => handlePersonalityClick(key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePersonalityClick(key)}
            >
              <div className="personality-emoji" style={{ fontSize: 32 }}>{getPersonalityEmoji(key)}</div>
              <h4>{personality.name}</h4>
              <p>{personality.description}</p>
              <div className="personality-traits">
                <small>{personality.traits}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 3: Choose Level */}
      {scenarioChosen && personalityChosen && (
        <div className="selector-section">
          <h2>🧭 Choose Your Level</h2>
          <p className="section-description">Pick the difficulty that suits you today.</p>

          <div className="level-grid">
            {Object.entries(levels).map(([key, meta]) => (
              <div
                key={key}
                className={`level-card ${selectedLevel === key ? 'selected' : ''}`}
                onClick={() => handleLevelClick(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLevelClick(key)}
                style={{ borderColor: meta.color, cursor: 'pointer' }}
                aria-pressed={selectedLevel === key}
              >
                <div className="level-header">
                  <span className="level-emoji" style={{ fontSize: 28, lineHeight: 1 }}>{meta.emoji}</span>
                  <span className="level-badge" style={{ backgroundColor: meta.color }}>{key}</span>
                </div>
                <p className="level-blurb">{meta.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scenarioChosen && (
        <div className="tips-section">
          <h3>💡 Tips for Success</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>🎯 Be Specific</h4>
              <p>Use concrete examples and details in your responses</p>
            </div>
            <div className="tip-card">
              <h4>🗣️ Speak Clearly</h4>
              <p>Avoid filler words like "um", "uh", and "like"</p>
            </div>
            <div className="tip-card">
              <h4>💪 Stay Confident</h4>
              <p>Use assertive language and maintain good posture</p>
            </div>
            <div className="tip-card">
              <h4>👂 Listen Actively</h4>
              <p>Pay attention to the AI's responses and build on them</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getPersonalityEmoji = (personalityKey) => {
  const emojiMap = {
    tough: '😤',
    friendly: '😊',
    neutral: '😐',
    skeptical: '🤨',
    supportive: '🤗',
    intimidating: '😠',
    chatty: '😄',
    empathetic: '🥺'
  };
  return emojiMap[personalityKey] || '🤖';
};

export default ScenarioSelector;
