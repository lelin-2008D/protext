let transactionSavedSound: HTMLAudioElement | undefined;

export const playTransactionSavedSound = () => {
  if (typeof Audio === 'undefined') return;

  transactionSavedSound ??= new Audio('/sounds/transaction-saved.mp3');
  transactionSavedSound.currentTime = 0;
  void transactionSavedSound.play().catch(() => {
    // Browser autoplay policies must never interrupt a successful save.
  });
};
