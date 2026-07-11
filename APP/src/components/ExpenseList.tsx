import React from 'react';
import type { Expense } from '../types/schemas';
import { formatMoney } from '../data/currencies';

interface Props {
  expenses: Expense[];
  currency?: string;
}

const ExpenseList: React.FC<Props> = ({ expenses, currency }) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-headline text-lg font-bold flex items-center justify-between px-2">
        <span className="doodle-underline">Recent Incursions</span>
        <span className="font-label text-[10px] uppercase text-on-surface-variant font-normal tracking-widest">
          {expenses.length} Total
        </span>
      </h3>
      
      {expenses.length === 0 ? (
        <div className="doodle-border border-dashed border-outline/20 p-5 md:p-8 text-center bg-surface-container-low">
          <p className="font-body text-sm text-on-surface-variant italic">The ledger is empty... for now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {expenses.sort((a, b) => b.timestamp - a.timestamp).map((exp) => (
            <div key={exp.id} className="tape-accent doodle-border bg-surface-container-low p-4 hover:bg-surface-container transition-colors relative overflow-hidden group">
              {/* Category Indicator */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-secondary/10 transition-colors"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label text-[10px] uppercase tracking-tighter bg-secondary/20 text-secondary px-2 py-0.5 rounded-sm">
                      {exp.category}
                    </span>
                    <span className="font-label text-[9px] text-on-surface-variant">
                      {new Date(exp.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <strong className="font-headline text-base text-on-surface group-hover:text-secondary transition-colors">
                    {exp.description || 'Untitled Transaction'}
                  </strong>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="font-headline text-xl font-black text-secondary">
                    -{formatMoney(exp.amount, currency, { fractionDigits: 2 })}
                  </span>
                  <span className="font-label text-[8px] uppercase tracking-widest text-on-surface-variant">Lost Cash</span>
                </div>
              </div>

              {/* Doodle Detail */}
              <div className="mt-2 pt-2 border-t border-outline/10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[10px] italic text-on-surface-variant/60 font-body">ID: {exp.id.slice(0, 8)}</span>
                 <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary/30"></div>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
