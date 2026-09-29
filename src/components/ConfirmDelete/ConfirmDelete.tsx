// Icons
import { TriangleAlert } from 'lucide-react';

interface ConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  title = 'Delete this deck?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDeleteProps) {
  return (
    <dialog className="modal" open={open}>
      <div className="modal-box">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-error/10 text-error rounded-full p-4">
            <TriangleAlert size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              {title}
            </h3>
            <p className="text-sm text-base-content/50 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn btn-md flex-1" onClick={onClose}>
            {cancelLabel}
          </button>
          <button className="btn btn-md btn-error flex-1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
