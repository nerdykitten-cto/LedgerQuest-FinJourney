import React, { useState } from 'react';
import type { Expense } from '../types/schemas';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onAddExpense: (expense: Expense) => void;
}

const ExpenseForm: React.FC<Props> = ({ onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const newExpense: Expense = {
      id: uuidv4(),
      amount: parseFloat(amount),
      category,
      description,
      timestamp: Date.now(),
    };

    onAddExpense(newExpense);
    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>Add Expense</h3>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Bills">Bills</option>
        <option value="Other">Other</option>
      </select>
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Log Expense</button>
    </form>
  );
};

export default ExpenseForm;
