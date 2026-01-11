import { useEffect, useMemo, useRef, useState } from "react";
import { container } from "@app/di/container";
import { TranslatorViewModelToken } from "@app/di/tokens";
import type { TranslatorViewModel } from "@ui/viewmodels/TranslatorViewModel";
import appIcon from "@ui/assets/app-icon.svg";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Textarea } from "@ui/components/ui/textarea";
import {
  History,
  Languages,
  PanelLeftClose,
  PanelLeftOpen,
  Settings
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@ui/components/ui/select";

const useViewModel = (vm: TranslatorViewModel) => {
  const [state, setState] = useState(vm.getState());
  useEffect(() => vm.subscribe(() => setState(vm.getState())), [vm]);
  return state;
};

type ViewKey = "translate" | "history" | "settings";

const tabs: { key: ViewKey; label: string }[] = [
  { key: "translate", label: "Translate" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" }
];

export const TranslatorView = () => {
  const viewModel = useMemo(
    () => container.resolve(TranslatorViewModelToken),
    []
  );
  const state = useViewModel(viewModel);
  const [activeView, setActiveView] = useState<ViewKey>("translate");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const lastErrorRef = useRef<string | undefined>(undefined);
  const detectedSourceLabel = useMemo(() => {
    if (!state.detectedSource) return undefined;
    const match = viewModel
      .getLanguages()
      .find((lang) => lang.code === state.detectedSource);
    return match?.label ?? state.detectedSource.toUpperCase();
  }, [state.detectedSource, viewModel]);

  useEffect(() => {
    viewModel.init().catch(() => {});
  }, [viewModel]);

  useEffect(() => {
    if (state.error && state.error !== lastErrorRef.current) {
      lastErrorRef.current = state.error;
      window.alert(state.error);
    }
  }, [state.error]);

  const handleCopyOutput = () => {
    if (!state.output) return;
    void navigator.clipboard?.writeText(state.output);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full overflow-hidden">
          <aside
            className={`flex h-full flex-col gap-2 border-r bg-card p-3 ${
              navCollapsed ? "w-16" : "w-56"
            }`}
          >
          <div className="drag-region flex h-10 items-center">
            <div className="no-drag flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="group relative flex h-10 w-10 items-center justify-center">
                  <img
                    src={appIcon}
                    alt="App icon"
                    className={`h-6 w-6 ${navCollapsed ? "group-hover:opacity-0" : ""}`}
                  />
                  {navCollapsed ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-0 h-10 w-10 rounded-md opacity-0 group-hover:opacity-100"
                      onClick={() => setNavCollapsed(false)}
                      aria-label="Expand sidebar"
                    >
                      <PanelLeftOpen className="h-4 w-4" strokeWidth={1.6} />
                    </Button>
                  ) : null}
                </div>
                {!navCollapsed ? (
                  <span className="text-xs font-semibold tracking-wide">
                    LLM Desk
                  </span>
                ) : null}
              </div>
              {!navCollapsed ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-md"
                  onClick={() => setNavCollapsed(true)}
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" strokeWidth={1.6} />
                </Button>
              ) : null}
            </div>
          </div>
          <div className="h-px w-full bg-border" />
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant="ghost"
              className={`h-10 w-full justify-start gap-3 px-3 ${
                activeView === tab.key ? "bg-accent text-foreground" : ""
              }`}
              onClick={() => setActiveView(tab.key)}
            >
              {tab.key === "translate" ? (
                <Languages className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              ) : null}
              {tab.key === "history" ? (
                <History className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              ) : null}
              {tab.key === "settings" ? (
                <Settings className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              ) : null}
              {!navCollapsed ? <span className="text-sm">{tab.label}</span> : null}
            </Button>
          ))}
          </aside>

          {activeView === "translate" ? (
          <main className="flex min-h-0 flex-1 flex-col overflow-auto">
            <div className="drag-region h-12 w-full shrink-0" />
            <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-6 pb-4">
              <section className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <Select
                    value={state.source}
                    onValueChange={(value) =>
                      viewModel.setSource(value as typeof state.source)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {viewModel.getLanguages().map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.code === "auto" && detectedSourceLabel
                            ? `${lang.label} (${detectedSourceLabel})`
                            : lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => viewModel.swapLanguages()}
                    aria-label="Swap languages"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7 7h10l-3-3m3 13H7l3 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground">To</label>
                  <Select
                    value={state.target}
                    onValueChange={(value) =>
                      viewModel.setTarget(value as typeof state.target)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {viewModel
                        .getLanguages()
                        .filter((lang) => lang.code !== "auto")
                        .map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-1 flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Input</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        disabled={state.loading}
                        onClick={() => viewModel.translate()}
                      >
                        {state.loading ? "Translating..." : "Translate"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => viewModel.setInput("")}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Paste or type text to translate..."
                    value={state.input}
                    onChange={(event) => viewModel.setInput(event.target.value)}
                    rows={10}
                    className="min-h-[220px] flex-1"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Output</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleCopyOutput}
                    >
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={state.output}
                    readOnly
                    placeholder="Translation will appear here."
                    rows={10}
                    className="min-h-[220px] flex-1"
                  />
                </div>
              </section>
            </div>
          </main>
          ) : null}

          {activeView === "history" ? (
            <main className="flex min-h-0 flex-1 flex-col overflow-auto">
              <div className="drag-region h-12 w-full shrink-0" />
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pb-4">
              <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">History</span>
                <p className="text-sm text-muted-foreground">No history yet.</p>
              </section>
            </div>
            </main>
          ) : null}

          {activeView === "settings" ? (
            <main className="flex min-h-0 flex-1 flex-col overflow-auto">
              <div className="drag-region h-12 w-full shrink-0" />
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pb-4">
              <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Appearance</span>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Theme</label>
                    <Select
                      value={state.themeMode}
                      onValueChange={(value) =>
                        viewModel.setThemeMode(value as typeof state.themeMode)
                      }
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Follow system</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px w-full bg-border" />

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium text-muted-foreground">LLM Settings</span>
                  <div className="grid gap-3">
                    <label className="text-xs text-muted-foreground">Base URL</label>
                    <Input
                      value={state.settings.baseUrl}
                      onChange={(event) =>
                        viewModel.updateSettings({ baseUrl: event.target.value })
                      }
                    />
                    <label className="text-xs text-muted-foreground">Model</label>
                    <Input
                      value={state.settings.model}
                      onChange={(event) =>
                        viewModel.updateSettings({ model: event.target.value })
                      }
                    />
                    <label className="text-xs text-muted-foreground">API Key</label>
                    <Input
                      type="password"
                      value={state.settings.apiKey}
                      onChange={(event) =>
                        viewModel.updateSettings({ apiKey: event.target.value })
                      }
                    />
                    <label className="text-xs text-muted-foreground">Temperature</label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={state.settings.temperature}
                      onChange={(event) =>
                        viewModel.updateSettings({
                          temperature: Number(event.target.value)
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="w-fit"
                      onClick={() => viewModel.persistSettings()}
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </section>
            </div>
            </main>
          ) : null}
        </div>
      </div>
    </div>
  );
};
