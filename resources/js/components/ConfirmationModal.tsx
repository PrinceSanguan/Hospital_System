import React from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  actionType?: 'approve' | 'reject' | 'confirm' | 'save' | 'default';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionType = 'default'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <p className="text-lg font-medium">
            {title || `Are you sure you want to ${actionType} this ${actionType === 'save' ? 'changes' : actionType === 'approve' ? 'request' : 'appointment'}?`}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={onConfirm}
            className="bg-green-500 hover:bg-green-600 text-white w-24"
          >
            YES
          </Button>
          <Button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white w-24"
          >
            NO
          </Button>
        </div>
      </div>
    </div>
  );
}
