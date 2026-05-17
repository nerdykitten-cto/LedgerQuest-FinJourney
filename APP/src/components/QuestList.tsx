import React from 'react';
import type { Quest } from '../types/schemas';

interface Props {
  quests: Quest[];
}

const QuestList: React.FC<Props> = ({ quests }) => {
  return (
    <div className="quest-list">
      <h3>Available Quests</h3>
      {quests.length === 0 ? (
        <p>No quests available. Log expenses to trigger quests!</p>
      ) : (
        <ul>
          {quests.map((q) => (
            <li key={q.id} className={`quest-item ${q.status}`}>
              <h4>{q.title}</h4>
              <p>{q.description}</p>
              <div>Difficulty: {q.difficulty}</div>
              <div>Reward: {q.reward.exp} EXP, {q.reward.gold} Gold</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QuestList;
