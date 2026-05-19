import React from 'react';
import type { Quest } from '../types/schemas';

interface Props {
  quests: Quest[];
  onStartQuest?: (id: string) => void;
  onCompleteQuest?: (id: string) => void;
}

const QuestList: React.FC<Props> = ({ quests, onStartQuest, onCompleteQuest }) => {
  return (
    <div className="quest-list">
      <h3>Quests</h3>
      {quests.length === 0 ? (
        <p>No quests active in this area.</p>
      ) : (
        <div className="quest-container">
          {quests.map((q) => (
            <div key={q.id} className={`quest-card ${q.status}`}>
              <div className="quest-header">
                <h4>[{q.type.toUpperCase()}] {q.title}</h4>
                <span className={`status-badge ${q.status}`}>{q.status}</span>
              </div>
              <p>{q.description}</p>
              <div className="quest-meta">
                <span>Difficulty: {q.difficulty}</span>
                <span>Reward: {q.reward.exp} EXP / {q.reward.gold} G</span>
              </div>
              
              <div className="quest-actions">
                {q.status === 'available' && onStartQuest && (
                  <button onClick={() => onStartQuest(q.id)} className="start-btn">
                    Start Quest
                  </button>
                )}
                {q.status === 'active' && onCompleteQuest && (
                  <button onClick={() => onCompleteQuest(q.id)} className="complete-btn">
                    Attempt
                  </button>
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
