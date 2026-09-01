// Modules
import { useState } from 'react';

// Store
import {
  buildDeckExportBlob,
  defaultExportFilename,
  downloadBlob,
  type DeckExportFormat,
} from '@/store/deckStore';

// Types
import type { Deck } from '@/types';

// Icons
import { FileJson, FileSpreadsheet, FolderOpen } from 'lucide-react';

interface ExportDeckModalProps {
  deck: Deck | null;
  onClose: () => void;
}

const supportsDirectoryPicker =
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

/**
 * Rendered with a `key` tied to the deck being exported (see HomePage), so a
 * fresh instance — and fresh state below — mounts each time a new export
 * starts instead of needing an effect to reset state on prop change.
 */
export default function ExportDeckModal({ deck, onClose }: ExportDeckModalProps) {
  const [format, setFormat] = useState<DeckExportFormat>('json');
  const [filename, setFilename] = useState(() =>
    deck ? defaultExportFilename(deck, 'json') : '',
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!deck) return null;

  const handleFormatChange = (next: DeckExportFormat) => {
    setFormat(next);
    setFilename((prev) => prev.replace(/\.(json|xlsx)$/i, `.${next}`));
  };

  const handleBrowse = async () => {
    if (!window.showDirectoryPicker) return;
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Could not access that folder.');
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleConfirm = async () => {
    const trimmedFilename = filename.trim();
    if (!trimmedFilename) return;

    setSaving(true);
    setError(null);
    try {
      const blob = await buildDeckExportBlob(deck, format);
      if (directoryHandle) {
        const fileHandle = await directoryHandle.getFileHandle(trimmedFilename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        downloadBlob(blob, trimmedFilename);
      }
      onClose();
    } catch {
      setError('Failed to export deck. Please try again.');
      setSaving(false);
    }
  };

  return (
    <dialog className="modal" open>
      <div className="modal-box">
        <h3 className="text-lg font-semibold text-base-content">Export Deck</h3>
        <p className="text-sm text-base-content/60 mt-1">
          Export &quot;{deck.name}&quot; as a file.
        </p>

        <div className="mt-5 space-y-4">
          {/* Format */}
          <div>
            <label className="label pt-0">
              <span className="label-text">Format</span>
            </label>
            <div className="join w-full">
              <button
                type="button"
                className={`btn btn-sm join-item flex-1 ${format === 'json' ? 'btn-primary' : 'btn-neutral'}`}
                onClick={() => handleFormatChange('json')}
              >
                <FileJson size={16} />
                JSON
              </button>
              <button
                type="button"
                className={`btn btn-sm join-item flex-1 ${format === 'xlsx' ? 'btn-primary' : 'btn-neutral'}`}
                onClick={() => handleFormatChange('xlsx')}
              >
                <FileSpreadsheet size={16} />
                Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label pt-0">
              <span className="label-text">File name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={defaultExportFilename(deck, format)}
            />
          </div>

          {/* Save to */}
          <div>
            <label className="label pt-0">
              <span className="label-text">Save to</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                className="input input-bordered flex-1 text-sm text-base-content/70"
                value={
                  directoryHandle
                    ? directoryHandle.name
                    : supportsDirectoryPicker
                      ? 'Default downloads folder'
                      : 'Not supported in this browser — downloads to your default folder'
                }
              />
              {supportsDirectoryPicker && (
                <button
                  type="button"
                  className="btn btn-sm btn-neutral shrink-0"
                  onClick={handleBrowse}
                >
                  <FolderOpen size={16} />
                  Browse
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="btn btn-md flex-1"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-md btn-primary flex-1"
            onClick={handleConfirm}
            disabled={!filename.trim() || saving}
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </dialog>
  );
}
