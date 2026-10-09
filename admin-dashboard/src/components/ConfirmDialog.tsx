import '../styles/modal.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay confirm-dialog"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal">
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div className="confirm-icon">⚠️</div>
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
