// Modules
import { useState } from 'react';

interface SaveVersionModalProps {
  onSave: (name: string, note: string) => void;
  onCancel: () => void;
}

export default function SaveVersionModal({
  onSave,
  onCancel,
}: SaveVersionModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl flex flex-col gap-5">
        <h2 className="text-white font-bold text-lg">Save as New Version</h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">Version Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. More Ramp, Control Build..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              Note <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What are you trying to improve?"
              rows={2}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSave(name, note)}
            disabled={!name.trim()}
            className="flex-1 bg-[#1971c2] hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Save Version
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-sm py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
