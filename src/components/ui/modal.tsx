'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        'relative w-full rounded-xl border border-[#1e293b] bg-[#111827] shadow-2xl',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-lg',
        size === 'lg' && 'max-w-2xl'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] px-5 py-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
