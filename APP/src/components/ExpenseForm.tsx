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
    <div className="bg-surface-container-high/30 p-6 doodle-border border-dashed border-outline/30 relative">
      <div className="absolute -top-3 -right-3 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center doodle-border animate-pulse group shadow-xl overflow-hidden">
        <img src="/assets/ui/Icon_ImageIcon_Lock02_btn.png" alt="" className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform" />
      </div>
      
      <h4 className="font-headline text-lg font-bold mb-6 flex items-center gap-3">
        <img src="/assets/ui/Icon_Gold.png" alt="" className="w-8 h-8 object-contain" />
        Transmute Currency
      </h4>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
             <img src="/assets/ui/Icon_Bag.png" alt="" className="w-4 h-4 object-contain opacity-60" /> Amount (Gold)
          </label>
          <div className="relative">
            <span className="absolute left-0 top-1 text-secondary font-bold text-2xl">$</span>
            <input
              className="w-full bg-transparent pencil-line pl-6 py-1 outline-none font-headline text-3xl text-secondary placeholder:text-secondary/10"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
             <img src="/assets/ui/Icon_GearWheels.png" alt="" className="w-4 h-4 object-contain opacity-60" /> Realm/Category
          </label>
          <select 
            className="w-full bg-surface-container-high doodle-border px-4 py-3 outline-none font-body text-sm cursor-pointer hover:bg-surface-container transition-colors shadow-md appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffeebb\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Food">🍗 Provisions (Food)</option>
            <option value="Transport">🐎 Carriage (Transport)</option>
            <option value="Entertainment">🎭 Tavern (Fun)</option>
            <option value="Bills">📜 Royal Tax (Bills)</option>
            <option value="Other">🎒 Miscellaneous (Other)</option>
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
             <img src="/assets/ui/Icon_Hourglass.png" alt="" className="w-4 h-4 object-contain opacity-60" /> Scribe Notes
          </label>
          <input
            className="w-full bg-transparent pencil-line py-2 outline-none font-body text-base placeholder:text-on-surface-variant/20 italic"
            type="text"
            placeholder="Describe the golden flow..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 pt-4">
          <button 
            type="submit" 
            className="doodle-btn w-full bg-secondary text-on-secondary font-headline font-black uppercase tracking-[0.2em] py-4 flex items-center justify-center gap-3 group shadow-lg"
          >
            Commit to Ledger
            <img src="/assets/ui/Icon_ImageIcon_Lock02_btn.png" alt="" className="w-6 h-6 object-contain group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
