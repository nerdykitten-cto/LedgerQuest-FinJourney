import React from 'react';

interface DialogueBoxProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] z-[2000] animate-in slide-in-from-bottom-4">
      <div 
        className="bg-[#171f33]/95 border-2 border-[#f4d03f]/50 p-6 shadow-2xl rounded-lg cursor-pointer hover:border-[#f4d03f]"
        onClick={onClose}
      >
        <p className="font-body text-[#dbe2fd] text-center text-lg leading-relaxed">
          {message}
        </p>
        <div className="text-[10px] font-label uppercase text-[#f4d03f]/60 text-center mt-4 tracking-widest animate-pulse">
          Click to dismiss
        </div>
      </div>
    </div>
  );
};
