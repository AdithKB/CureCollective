import React from 'react';
import { useAuthModal } from '../contexts/AuthModalContext';
import LoginSignup from './LoginSignup';
import { Modal, Backdrop, Fade } from '@mui/material';

const AuthModal: React.FC = () => {
  const { isModalOpen, closeModal } = useAuthModal();

  const handleClose = (e: React.MouseEvent) => {
    closeModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <Modal
      open={isModalOpen}
      onClose={handleClose}
      closeAfterTransition
      BackdropProps={{
        timeout: 500,
        onClick: handleBackdropClick
      }}
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <Fade in={isModalOpen}>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <LoginSignup />
          </div>
        </div>
      </Fade>
    </Modal>
  );
};

export default AuthModal; 