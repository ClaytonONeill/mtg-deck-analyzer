// Modules
import { useState } from 'react';

// Store
import {
  buildDeckExportBlob,
  buildDeckTextExport,
  defaultExportFilename,
  downloadBlob,
  type DeckExportFormat,
} from '@/store/deckStore';

// Types
import type { Deck } from '@/types';

// Icons
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  ClipboardCopy,
  ClipboardCheck,
} from 'lucide-react';

interface ExportDeckModalProps {
  deck: Deck | null;
  onClose: () => void;
  /** Clear label for whichever build is being exported, e.g. "Main Build"
   * or a version's name — shown prominently so it's obvious which one
   * you're about to download. */
  versionLabel?: string;
}

const supportsDirectoryPicker =
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

/**
 * Rendered with a `key` tied to the deck being exported (see HomePage), so a
 * fresh instance — and fresh state below — mounts each time a new export
 * starts instead of needing an effect to reset state on prop change.
 */
export default function ExportDeckModal({
  deck,
  onClose,
  versionLabel,
}: ExportDeckModalProps) {
  const [format, setFormat] = useState<DeckExportFormat>('json');
  const [filename, setFilename] = useState(() =>
    deck ? defaultExportFilename(deck, 'json') : '',
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!deck) return null;

  const handleFormatChange = (next: DeckExportFormat) => {
    setFormat(next);
    setFilename((prev) => prev.replace(/\.(json|xlsx|txt)$/i, `.${next}`));
  };

  const handleCopyToClipboard = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(buildDeckTextExport(deck));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
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

        {versionLabel && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">
              Exporting
            </span>
            <span className="badge badge-secondary badge-outline font-bold">
              {versionLabel}
            </span>
          </div>
        )}

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
              <button
                type="button"
                className={`btn btn-sm join-item flex-1 ${format === 'txt' ? 'btn-primary' : 'btn-neutral'}`}
                onClick={() => handleFormatChange('txt')}
              >
                <FileText size={16} />
                Text List
              </button>
            </div>
            {format === 'txt' && (
              <p className="text-xs text-base-content/50 mt-1.5">
                Plain "quantity + card name" lines — the format most
                deckbuilding sites accept when pasting a decklist from your
                clipboard.
              </p>
            )}
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

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            className="btn btn-md flex-1 min-w-[100px]"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          {format === 'txt' && (
            <button
              type="button"
              className="btn btn-md btn-secondary flex-1 min-w-[100px]"
              onClick={handleCopyToClipboard}
            >
              {copied ? (
                <>
                  <ClipboardCheck size={16} /> Copied!
                </>
              ) : (
                <>
                  <ClipboardCopy size={16} /> Copy
                </>
              )}
            </button>
          )}
          <button
            className="btn btn-md btn-primary flex-1 min-w-[100px]"
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
