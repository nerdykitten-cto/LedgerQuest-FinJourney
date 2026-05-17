import React from 'react';
import type { Quest } from '../types/schemas';

interface Props {
  quests: Quest[];
  onStartQuest: (id: string) => void;
  onCompleteQuest: (id: string) => void;
}

const QuestList: React.FC<Props> = ({ quests, onStartQuest, onCompleteQuest }) => {
  return (
    <div className="quest-list">
      <h3>Quests</h3>
      {quests.length === 0 ? (
        <p>No quests available. Log expenses to trigger quests!</p>
      ) : (
        <div className="quest-container">
          {quests.map((q) => (
            <div key={q.id} className={`quest-card ${q.status}`}>
              <div className="quest-header">
                <h4>{q.title}</h4>
                <span className={`status-badge ${q.status}`}>{q.status}</span>
              </div>
              <p>{q.description}</p>
              <div className="quest-meta">
                <span>Difficulty: {q.difficulty}</span>
                <span>Reward: {q.reward.exp} EXP / {q.reward.gold} G</span>
              </div>
              
              <div className="quest-actions">
                {q.status === 'available' && (
                  <button onClick={() => onStartQuest(q.id)} className="start-btn">
                    Start Quest (5 AP)
                  </button>
                )}
                {q.status === 'active' && (
                  <button onClick={() => onCompleteQuest(q.id)} className="complete-btn">
                    Attempt Completion
                  </button>
                )}
                {(q.status === 'completed' || q.status === 'failed') && (
                  <span className="final-status">Result: {q.status.toUpperCase()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestList;
