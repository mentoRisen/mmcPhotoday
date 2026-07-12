"use client";

import { useEffect, useRef } from "react";

type ActionAlertDialogProps = {
  message: string | null;
  title?: string;
  onClose?: () => void;
};

export default function ActionAlertDialog({
  message,
  title = "Upozornenie",
  onClose,
}: ActionAlertDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (message) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="action-alert-dialog"
      aria-labelledby="action-alert-title"
      aria-describedby="action-alert-message"
      onClose={() => onClose?.()}
    >
      <form method="dialog" className="action-alert-dialog-inner">
        <h2 id="action-alert-title" className="action-alert-title">
          {title}
        </h2>
        <p id="action-alert-message" className="action-alert-message">
          {message}
        </p>
        <button type="submit" className="btn btn-primary">
          OK
        </button>
      </form>
    </dialog>
  );
}
