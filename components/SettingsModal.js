"use client";

export default function SettingsModal({
  settings,
  onChange,
  onClose,
  onClearAll,
  models,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-void-600 bg-void-900 p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-starlight-50">Settings</h2>
          <button
            onClick={onClose}
            className="text-starlight-500 hover:text-starlight-100"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-starlight-500">
              Theme
            </label>
            <div className="flex gap-2">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ ...settings, theme: t })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    settings.theme === t
                      ? "border-nebula-500 bg-nebula-500/10 text-starlight-50"
                      : "border-void-600 text-starlight-300 hover:bg-void-850"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-starlight-500">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => onChange({ ...settings, model: e.target.value })}
              className="w-full rounded-lg border border-void-600 bg-void-850 px-3 py-2 text-sm text-starlight-100 outline-none focus:border-nebula-500"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-starlight-500">
                Temperature
              </label>
              <span className="text-xs text-starlight-300">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                onChange({ ...settings, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-nebula-500"
            />
          </div>

          <button
            onClick={onClearAll}
            className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            Clear all conversations
          </button>

          <p className="text-center text-[11px] text-starlight-500">
            Nexora AI
          </p>
        </div>
      </div>
    </div>
  );
}
