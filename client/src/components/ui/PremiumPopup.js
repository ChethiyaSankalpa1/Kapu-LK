import React from 'react';
import AdRotatorModal from './AdRotatorModal';

/**
 * Legacy PremiumPopup wrapper delegating to modern AdRotatorModal.
 */
const PremiumPopup = ({ onClose, onUpgrade }) => {
  return (
    <AdRotatorModal
      isOpenOverride={true}
      onCloseOverride={onClose}
    />
  );
};

export default PremiumPopup;
