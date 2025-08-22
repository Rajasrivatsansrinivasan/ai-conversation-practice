import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Award, Target, Calendar, BarChart3 } from 'lucide-react';

const ProgressTracker = ({ onBack }) => {
  const [stats, setStats] = useState({
    conversationsCompleted: 0,
    totalTimeSpent: 0,
    averageConfidence: 0,
    improvementTrend: [],
    strongestScenarios: [],
    areasToImprove: [],
    weeklyGoal: 5,
    currentStreak: 0,
    longestStreak: 0,
    achievements: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('conversationStats');
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats(prevStats => ({ ...prevStats, ...parsedStats }));
    }

    // Generate sample data for demo
    const sampleData = {
      conversationsCompleted: 15,
      totalTimeSpent: 45,
      averageConfidence: 72,
      improvementTrend: [
        { date: '2024-01-01', confidence: 45, scenario: 'jobInterview' },
        { date: '2024-01-03', confidence: 52, scenario: 'networking' },
        { date: '2024-01-05', confidence: 48, scenario: 'conflict' },
        { date: '2024-01-07', confidence: 61, scenario: 'jobInterview' },
        { date: '2024-01-09', confidence: 67, scenario: 'networking' },
        { date: '2024-01-11', confidence: 72, scenario: 'jobInterview' },
        { date: '2024-01-13', confidence: 78, scenario: 'networking' }
      ],
      strongestScenarios: [
        { scenario: 'networking', confidence: 85 },
        { scenario: 'jobInterview', confidence: 78 },
        { scenario: 'socialAnxiety', confidence: 72 }
      ],
      areasToImprove: [
        { scenario: 'conflict', confidence: 45 },
        { scenario: 'publicSpeaking', confidence: 52 },
        { scenario: 'customerService', confidence: 58 }
      ],
      currentStreak: 3,
      longestStreak: 7,
      achievements: [
        {
          id: 'first-conversation',
          title: 'First Steps',
          description: 'Completed your first practice conversation',
          icon: '🎯',
          date: '2024-01-01'
        },
        {
          id: 'confident-speaker',
          title: 'Confident Speaker',
          description: 'Achieved 80%+ confidence in 5 conversations',
          icon: '🗣️',
          date: '2024-01-10'
        }
      ]
    };

    setStats(prevStats => ({ ...prevStats, ...sampleData }));
  };

  const getProgressToGoal = () => {
    // Calculate progress towards weekly goal
    const progress = (stats.conversationsCompleted % stats.weeklyGoal) / stats.weeklyGoal * 100;
    return Math.min(100, progress);
  };

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
          Back to Practice
        </button>
        <h1>📊 Your Progress</h1>
      </div>

      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.conversationsCompleted}</h3>
            <p>Conversations Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.averageConfidence}%</h3>
            <p>Average Confidence</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{stats.totalTimeSpent}m</h3>
            <p>Total Practice Time</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.currentStreak}</h3>
            <p>Day Streak</p>
          </div>
        </div>
      </div>

      <div className="progress-content">
        <div className="progress-section">
          <h2><TrendingUp size={24} /> Improvement Trend</h2>
          <div className="trend-chart">
            {stats.improvementTrend.length > 0 ? (
              <div className="chart-container">
                {stats.improvementTrend.map((point, index) => (
                  <div 
                    key={index} 
                    className="trend-point" 
                    style={{ height: `${point.confidence}%` }}
                  >
                    <div className="point-tooltip">
                      <div>{point.confidence}% confidence</div>
                      <div>{point.scenario}</div>
                      <div>{point.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>Start practicing to see your improvement trend!</p>
              </div>
            )}
          </div>
        </div>

        <div className="progress-section">
          <h2><Target size={24} /> Weekly Goal</h2>
          <div className="goal-progress">
            <div className="goal-bar">
              <div 
                className="goal-fill" 
                style={{ width: `${getProgressToGoal()}%` }}
              />
            </div>
            <p>
              {Math.round(getProgressToGoal())}% complete 
              ({stats.conversationsCompleted % stats.weeklyGoal} / {stats.weeklyGoal} conversations this week)
            </p>
          </div>
        </div>

        <div className="progress-section">
          <h2><BarChart3 size={24} /> Scenario Performance</h2>
          <div className="scenario-stats">
            {stats.strongestScenarios.length > 0 ? (
              <>
                <h3>💪 Your Strengths</h3>
                <div className="performance-list">
                  {stats.strongestScenarios.map((item, index) => (
                    <div key={index} className="performance-item strength">
                      <span className="scenario-name">{item.scenario}</span>
                      <span className="confidence-score">{Math.round(item.confidence)}%</span>
                    </div>
                  ))}
                </div>

                <h3>📈 Areas to Improve</h3>
                <div className="performance-list">
                  {stats.areasToImprove.map((item, index) => (
                    <div key={index} className="performance-item improvement">
                      <span className="scenario-name">{item.scenario}</span>
                      <span className="confidence-score">{Math.round(item.confidence)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>Complete more conversations to see detailed performance analytics!</p>
              </div>
            )}
          </div>
        </div>

        <div className="progress-section">
          <h2><Award size={24} /> Achievements</h2>
          <div className="achievements-grid">
            {stats.achievements.length > 0 ? (
              stats.achievements.map((achievement, index) => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  <small>Earned: {achievement.date}</small>
                </div>
              ))
            ) : (
              <div className="no-achievements">
                <p>🏆 Your achievements will appear here as you practice!</p>
              </div>
            )}
          </div>
        </div>

        <div className="progress-section">
          <h2><Calendar size={24} /> Practice Calendar</h2>
          <div className="calendar-heatmap">
            {/* Generate sample calendar data */}
            {Array.from({ length: 30 }, (_, i) => (
              <div 
                key={i} 
                className="calendar-day"
                style={{ 
                  backgroundColor: `rgba(46, 213, 115, ${Math.random() > 0.7 ? Math.random() * 0.8 + 0.2 : 0.1})` 
                }}
                title={`Day ${i + 1}: ${Math.floor(Math.random() * 3)} conversations`}
              >
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="calendar-legend">
            <span>Less</span>
            <div className="legend-scale">
              <div className="legend-item" style={{ backgroundColor: 'rgba(46, 213, 115, 0.1)' }}></div>
              <div className="legend-item" style={{ backgroundColor: 'rgba(46, 213, 115, 0.3)' }}></div>
              <div className="legend-item" style={{ backgroundColor: 'rgba(46, 213, 115, 0.6)' }}></div>
              <div className="legend-item" style={{ backgroundColor: 'rgba(46, 213, 115, 1)' }}></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;