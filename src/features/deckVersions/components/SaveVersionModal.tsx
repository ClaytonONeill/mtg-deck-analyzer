// Modules
import { useState } from 'react';

// Types
import type { DeckVersion } from '@/types';

type SaveMode = 'new' | 'update';

interface SaveVersionModalProps {
  existingVersions: DeckVersion[];
  onSave: (name: string, note: string) => void;
  onUpdate: (versionId: string) => void;
  onCancel: () => void;
}

export default function SaveVersionModal({
  existingVersions,
  onSave,
  onUpdate,
  onCancel,
}: SaveVersionModalProps) {
  const [mode, setMode] = useState<SaveMode>(
    existingVersions.length > 0 ? 'update' : 'new',
  );
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    existingVersions[0]?.id ?? '',
  );

  const handleSave = () => {
    if (mode === 'new') {
      if (!name.trim()) return;
      onSave(name, note);
    } else {
      if (!selectedVersionId) return;
      onUpdate(selectedVersionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl flex flex-col gap-5">
        <h2 className="text-white font-bold text-lg">Save Version</h2>

        {/* Mode toggle — only show if versions exist */}
        {existingVersions.length > 0 && (
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setMode('update')}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={{
                backgroundColor: mode === 'update' ? '#1971c2' : 'transparent',
                color: mode === 'update' ? '#fff' : '#64748b',
              }}
            >
              Update Existing
            </button>
            <button
              onClick={() => setMode('new')}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={{
                backgroundColor: mode === 'new' ? '#1971c2' : 'transparent',
                color: mode === 'new' ? '#fff' : '#64748b',
              }}
            >
              Save as New
            </button>
          </div>
        )}

        {/* Update existing */}
        {mode === 'update' && existingVersions.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">
                Select Version to Update
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
              >
                {existingVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-slate-500 text-xs">
              The new swaps will be appended to this version's existing swaps.
            </p>
          </div>
        )}

        {/* Save as new */}
        {mode === 'new' && (
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
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={mode === 'new' ? !name.trim() : !selectedVersionId}
            className="flex-1 bg-[#1971c2] hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {mode === 'new' ? 'Save Version' : 'Update Version'}
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
