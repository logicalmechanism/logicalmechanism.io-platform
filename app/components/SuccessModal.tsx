import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: JSX.Element | string;
}

const SuccessModal: React.FC<ModalProps> = ({ isOpen, onClose, content }) => {
  // Handle the escape key press for closing the modal
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onClose]);

  // Close modal when clicking outside of it
  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).id === 'modal-backdrop') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={handleOutsideClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg relative w-1/3">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-4 font-bold text-gray-800"
        >
          Close
        </button>
        <div className="mt-4">{content}</div>
      </div>
    </div>
  );
};

export default SuccessModal;
