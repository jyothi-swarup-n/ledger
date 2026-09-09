import React from 'react';
import { AuthScreen } from './AuthScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0e14]">
      <div className="min-h-full flex justify-center">
        <AuthScreen onSuccess={onClose} />
      </div>
    </div>
  );
};
