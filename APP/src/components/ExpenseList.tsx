import React from 'react';
import type { Expense } from '../types/schemas';

interface Props {
  expenses: Expense[];
}

const ExpenseList: React.FC<Props> = ({ expenses }) => {
  return (
    <div className="expense-list">
      <h3>Recent Expenses</h3>
      {expenses.length === 0 ? (
        <p>No expenses logged yet.</p>
      ) : (
        <ul>
          {expenses.map((exp) => (
            <li key={exp.id}>
              <span>{exp.category}: ${exp.amount}</span>
              <small> {new Date(exp.timestamp).toLocaleDateString()}</small>
              <p>{exp.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpenseList;
