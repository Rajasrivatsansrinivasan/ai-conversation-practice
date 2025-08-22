import React, { useState } from 'react';
import ScenarioSelector from './components/ScenarioSelector';
import ConversationInterface from './components/ConversationInterface';
import ProgressTracker from './components/ProgressTracker';
import './styles/components.css';

function App() {
  const [currentView, setCurrentView] = useState('selector');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState('neutral');
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleScenarioSelect = (scenarioKey, scenario) => {
    setSelectedScenario({ key: scenarioKey, ...scenario });
    setSelectedLevel(null); // reset level when scenario changes
  };

  const handlePersonalitySelect = (personality) => {
    setSelectedPersonality(personality);
  };

  const handleLevelSelect = (levelKey) => {
    setSelectedLevel(levelKey);
  };

  const startConversation = () => {
    if (selectedScenario && selectedPersonality && selectedLevel) {
      setCurrentView('conversation');
    }
  };

  const goBack = () => {
    setCurrentView('selector');
    setSelectedScenario(null);
    setSelectedLevel(null);
  };

  const showProgress = () => setCurrentView('progress');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗣️ Speak Easy </h1>
        <p>Practice conversations in a safe, judgment-free environment</p>

        <nav className="app-nav">
          <button
            onClick={() => setCurrentView('selector')}
            className={currentView === 'selector' ? 'active' : ''}
          >
            Practice
          </button>
          <button
            onClick={showProgress}
            className={currentView === 'progress' ? 'active' : ''}
          >
            Progress
          </button>
        </nav>
      </header>

      {currentView === 'selector' && (
        <div>
          <ScenarioSelector
            onScenarioSelect={handleScenarioSelect}
            onPersonalitySelect={handlePersonalitySelect}
            onLevelSelect={handleLevelSelect}
            selectedScenario={selectedScenario}
            selectedPersonality={selectedPersonality}
            selectedLevel={selectedLevel}
          />

          {selectedScenario && (
            <div className="start-section">
              <h3>Ready to Practice?</h3>
              <p>Scenario: <strong>{selectedScenario.title}</strong></p>
              <p>AI Personality: <strong>{selectedPersonality}</strong></p>
              <p>Level: <strong>{selectedLevel || '—'}</strong></p>
              <button
                onClick={startConversation}
                className="start-btn"
                disabled={!selectedLevel}
              >
                Start Conversation
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'conversation' && (
        <ConversationInterface
          scenario={selectedScenario}
          personality={selectedPersonality}
          userLevel={selectedLevel}
          onBack={goBack}
        />
      )}

      {currentView === 'progress' && (
        <ProgressTracker onBack={() => setCurrentView('selector')} />
      )}
    </div>
  );
}

export default App;
