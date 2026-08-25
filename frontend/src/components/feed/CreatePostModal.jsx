import React from 'react';
import { Modal } from '../ui/Modal.jsx';
import { CreatePostBox } from './CreatePostBox.jsx';

export function CreatePostModal({ isOpen, onClose, onPostCreated, defaultCommunityId = null }) {
  const handleCreated = (post) => {
    if (onPostCreated) {
      onPostCreated(post);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear nueva publicación" maxWidth="max-w-xl">
      <CreatePostBox
        autoFocus={true}
        defaultCommunityId={defaultCommunityId}
        onPostCreated={handleCreated}
      />
    </Modal>
  );
}
