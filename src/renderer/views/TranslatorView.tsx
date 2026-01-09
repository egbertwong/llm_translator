import { useEffect, useMemo, useState } from "react";
import { container } from "@app/di/container";
import { TranslatorViewModelToken } from "@app/di/tokens";
import type { TranslatorViewModel } from "@ui/viewmodels/TranslatorViewModel";
import { TitleBar } from "@ui/components/TitleBar";

const useViewModel = (vm: TranslatorViewModel) => {
  const [state, setState] = useState(vm.getState());
  useEffect(() => vm.subscribe(() => setState(vm.getState())), [vm]);
  return state;
};

export const TranslatorView = () => {
  const viewModel = useMemo(
    () => container.resolve(TranslatorViewModelToken),
    []
  );
  const state = useViewModel(viewModel);
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    viewModel.init().catch(() => {});
  }, [viewModel]);

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="workspace">
        <aside className={`sidebar${navCollapsed ? " is-collapsed" : ""}`}>
          <button
            type="button"
            className="sidebar__toggle"
            onClick={() => setNavCollapsed((value) => !value)}
            aria-label="Toggle navigation"
          >
            <svg className="sidebar__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button type="button" className="sidebar__item sidebar__item--active">
            <svg className="sidebar__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 7h10v10H7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            <span className="sidebar__label">Translate</span>
          </button>
          <button type="button" className="sidebar__item">
            <svg className="sidebar__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 7h12M6 12h8M6 17h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="sidebar__label">History</span>
          </button>
          <div className="sidebar__spacer" />
          <button
            type="button"
            className="sidebar__item"
            onClick={() => viewModel.setSettingsOpen(true)}
          >
            <svg className="sidebar__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M4 12h2m12 0h2M12 4v2m0 12v2M6.2 6.2l1.4 1.4m8.8 8.8l1.4 1.4m0-11.6l-1.4 1.4M7.6 17.6l-1.4 1.4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="sidebar__label">Settings</span>
          </button>
        </aside>

        <div className="main-area">
          <div className="lang-row">
            <select
              value={state.source}
              onChange={(event) => viewModel.setSource(event.target.value as typeof state.source)}
            >
              {viewModel.getLanguages().map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="swap-button"
              onClick={() => viewModel.swapLanguages()}
              aria-label="Swap languages"
            >
              <svg className="swap-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 7h10l-3-3m3 13H7l3 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <select
              value={state.target}
              onChange={(event) => viewModel.setTarget(event.target.value as typeof state.target)}
            >
              {viewModel
                .getLanguages()
                .filter((lang) => lang.code !== "auto")
                .map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
            </select>
          </div>

          <main className="content-grid">
            <section className="panel">
              <div className="textarea-group">
                <label>Input</label>
                <textarea
                  placeholder="Paste or type text to translate..."
                  value={state.input}
                  onChange={(event) => viewModel.setInput(event.target.value)}
                  rows={12}
                />
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={state.loading}
                  onClick={() => viewModel.translate()}
                >
                  {state.loading ? "Translating..." : "Translate"}
                </button>
                {state.detectedSource && state.source === "auto" ? (
                  <p className="hint">Detected: {state.detectedSource.toUpperCase()}</p>
                ) : null}
                {state.error ? <p className="error">{state.error}</p> : null}
              </div>
            </section>

            <section className="panel output-panel">
              <label>Output</label>
              <textarea
                className="output-textarea"
                value={state.output}
                readOnly
                placeholder="Translation will appear here."
                rows={12}
              />
            </section>
          </main>
        </div>
      </div>

      {state.settingsOpen ? (
        <aside className="settings-panel">
          <div className="settings-head">
            <h2>Settings</h2>
            <button
              type="button"
              className="ghost-button"
              onClick={() => viewModel.setSettingsOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="settings-grid">
            <label>
              Theme
              <select
                value={state.themeMode}
                onChange={(event) =>
                  viewModel.setThemeMode(event.target.value as typeof state.themeMode)
                }
              >
                <option value="system">Follow system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Base URL
              <input
                type="text"
                value={state.settings.baseUrl}
                onChange={(event) => viewModel.updateSettings({ baseUrl: event.target.value })}
              />
            </label>
            <label>
              Model
              <input
                type="text"
                value={state.settings.model}
                onChange={(event) => viewModel.updateSettings({ model: event.target.value })}
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={state.settings.apiKey}
                onChange={(event) => viewModel.updateSettings({ apiKey: event.target.value })}
              />
            </label>
            <label>
              Temperature
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={state.settings.temperature}
                onChange={(event) =>
                  viewModel.updateSettings({ temperature: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => viewModel.persistSettings()}
          >
            Save Settings
          </button>
        </aside>
      ) : null}
    </div>
  );
};
