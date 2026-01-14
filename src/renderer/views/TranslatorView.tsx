import type { TextareaHTMLAttributes, UIEvent } from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { container } from "@app/di/container";
import { TranslatorViewModelToken } from "@app/di/tokens";
import type { LlmSettings } from "@domain/models/Settings";
import type { HistoryItem, HistoryType } from "@domain/models/History";
import type { TranslatorViewModel } from "@ui/viewmodels/TranslatorViewModel";
import appIcon from "@ui/assets/app-icon.svg";
import appInfo from "../../../package.json";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Textarea } from "@ui/components/ui/textarea";
import {
  History,
  Languages,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@ui/components/ui/select";

const VARIABLE_STYLE: Record<string, string> = {
  source:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  target:
    "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
  text:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
};

const renderHighlightedTemplate = (value: string) => {
  const nodes: Array<JSX.Element> = [];
  const regex = /{{\s*[a-zA-Z0-9_]+\s*}}/g;
  let lastIndex = 0;
  let match = regex.exec(value);
  let key = 0;

  while (match) {
    const token = match[0];
    const index = match.index;
    if (index > lastIndex) {
      nodes.push(
        <span key={`text-${key++}`} className="text-foreground">
          {value.slice(lastIndex, index)}
        </span>
      );
    }
    const name = token.slice(2, -2).trim();
    const style = VARIABLE_STYLE[name] ?? "bg-muted text-foreground";
    nodes.push(
      <span key={`token-${key++}`} className={`rounded-sm ${style}`}>
        {token}
      </span>
    );
    lastIndex = index + token.length;
    match = regex.exec(value);
  }

  if (lastIndex < value.length) {
    nodes.push(
      <span key={`text-${key++}`} className="text-foreground">
        {value.slice(lastIndex)}
      </span>
    );
  }

  if (nodes.length === 0) {
    return <span className="text-foreground">{value}</span>;
  }

  return nodes;
};

const serializeSettings = (settings: LlmSettings) =>
  JSON.stringify(settings);

const aboutItems: Array<{ label: string; value: string }> = [
  { label: "Product", value: appInfo.productName ?? "Refinery" },
  { label: "Version", value: appInfo.version ?? "0.0.0" },
  { label: "Author", value: appInfo.author ?? "Unknown" },
  { label: "Description", value: appInfo.description ?? "" }
];

const historyTypeOptions: Array<{ value: HistoryType | "all"; label: string }> =
  [
    { value: "all", label: "All types" },
    { value: "translation", label: "Translation" }
  ];

const formatHistoryTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString();

const truncatePreview = (value: string, max = 120) => {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
};

const historyTypeLabel = (type: HistoryType) =>
  type === "translation" ? "Translation" : type;

const getHistoryPreview = (item: HistoryItem) => {
  if (item.type === "translation") {
    return truncatePreview(item.payload.input || item.payload.output);
  }
  return "";
};

const PromptTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, value = "", onChange, onScroll, ...props }, ref) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    onScroll?.(event);
    if (overlayRef.current) {
      overlayRef.current.scrollTop = event.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  return (
    <div
      className={`relative h-full w-full rounded-md border border-input bg-background shadow-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className ?? ""
        }`}
    >
      <div
        ref={overlayRef}
        className={`pointer-events-none absolute inset-0 overflow-auto px-3 py-2 text-sm leading-6 ${isComposing ? "opacity-0" : "opacity-100"
          }`}
        aria-hidden="true"
      >
        <div className="whitespace-pre-wrap">
          {renderHighlightedTemplate(String(value))}
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        className={`relative h-full w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${isComposing ? "text-foreground" : "text-transparent caret-foreground"
          }`}
        {...props}
      />
    </div>
  );
});
PromptTextarea.displayName = "PromptTextarea";

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
  const systemPromptRef = useRef<HTMLTextAreaElement | null>(null);
  const userPromptRef = useRef<HTMLTextAreaElement | null>(null);
  const settingsScrollRef = useRef<HTMLDivElement | null>(null);
  const settingsAppearanceRef = useRef<HTMLElement | null>(null);
  const settingsLlmRef = useRef<HTMLElement | null>(null);
  const settingsPromptsRef = useRef<HTMLElement | null>(null);
  const settingsAboutRef = useRef<HTMLElement | null>(null);
  const savedSettingsRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<number | undefined>(undefined);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "ok" | "fail"
  >("idle");
  const [testMessage, setTestMessage] = useState("");
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    "appearance" | "llm" | "prompts" | "about"
  >("appearance");
  const detectedSourceLabel = useMemo(() => {
    if (!state.detectedSource) return undefined;
    const match = viewModel
      .getLanguages()
      .find((lang) => lang.code === state.detectedSource);
    return match?.label ?? state.detectedSource.toUpperCase();
  }, [state.detectedSource, viewModel]);
  const filteredHistory = useMemo(() => {
    if (state.historyFilter === "all") return state.history;
    return state.history.filter((item) => item.type === state.historyFilter);
  }, [state.history, state.historyFilter]);

  useEffect(() => {
    viewModel.init().catch(() => { });
  }, [viewModel]);

  useEffect(() => {
    if (state.error && state.error !== lastErrorRef.current) {
      lastErrorRef.current = state.error;
      window.alert(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    if (!state.settingsReady) return;
    const serialized = serializeSettings(state.settings);
    if (savedSettingsRef.current === null) {
      savedSettingsRef.current = serialized;
      return;
    }
    if (serialized === savedSettingsRef.current) return;
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(async () => {
      try {
        await viewModel.persistSettings();
        savedSettingsRef.current = serialized;
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Failed to save settings."
        );
      }
    }, 400);
  }, [state.settings, state.settingsReady, viewModel]);

  useEffect(() => {
    if (!state.settingsReady) return;
    setTestStatus("idle");
    setTestMessage("");
  }, [state.settings.baseUrl, state.settings.apiKey, state.settingsReady]);

  useEffect(() => {
    if (activeView !== "settings") return;
    const container = settingsScrollRef.current;
    const sections = [
      settingsAppearanceRef.current,
      settingsLlmRef.current,
      settingsPromptsRef.current,
      settingsAboutRef.current
    ].filter(Boolean) as HTMLElement[];
    if (!container || sections.length === 0) return;

    let rafId = 0;
    const updateActive = () => {
      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top;
      let closest: { key: "appearance" | "llm" | "prompts" | "about"; dist: number } | null =
        null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const dist = Math.abs(sectionCenter - centerY);
        const key = section.getAttribute("data-section") as
          | "appearance"
          | "llm"
          | "prompts"
          | "about"
          | null;
        if (!key) return;
        if (!closest || dist < closest.dist) {
          closest = { key, dist };
        }
      });

      if (closest) setActiveSettingsSection(closest.key);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateActive();
      });
    };

    updateActive();
    container.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeView]);

  const handleCopyOutput = () => {
    if (!state.output) return;
    void navigator.clipboard?.writeText(state.output);
  };

  const handleTestBaseUrl = async () => {
    const baseUrl = state.settings.baseUrl.trim();
    if (!baseUrl) {
      setTestStatus("fail");
      setTestMessage("Base URL required");
      return;
    }
    setTestStatus("testing");
    setTestMessage("Testing...");
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const endpoint = trimmedBase.endsWith("/v1")
      ? `${trimmedBase}/models`
      : `${trimmedBase}/v1/models`;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: state.settings.apiKey
          ? { Authorization: `Bearer ${state.settings.apiKey}` }
          : undefined
      });
      if (!response.ok) {
        setTestStatus("fail");
        setTestMessage(`Failed (${response.status})`);
        return;
      }
      setTestStatus("ok");
      setTestMessage("OK");
    } catch {
      setTestStatus("fail");
      setTestMessage("Failed");
    }
  };

  const insertPromptVariable = (
    field: "system" | "user",
    variable: string
  ) => {
    const current = state.settings.prompts.translate[field];
    const ref = field === "system" ? systemPromptRef : userPromptRef;
    const textarea = ref.current;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const next =
      current.slice(0, start) + variable + current.slice(end);
    viewModel.updateSettings({
      prompts: {
        ...state.settings.prompts,
        translate: {
          ...state.settings.prompts.translate,
          [field]: next
        }
      }
    });
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const pos = start + variable.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const requestViewChange = async (nextView: ViewKey) => {
    if (nextView === activeView) return;
    setActiveView(nextView);
  };

  const renderScrollableMain = (
    content: React.ReactNode,
    scrollRef?: React.RefObject<HTMLDivElement>
  ) => (
    <main className="relative flex min-h-0 flex-1 overflow-hidden">
      <div className="drag-region absolute left-0 right-0 top-0 h-12" />
      <div
        ref={scrollRef}
        className="absolute inset-x-0 bottom-0 top-12 overflow-auto"
      >
        <div className="flex min-h-full flex-col">{content}</div>
      </div>
    </main>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full overflow-hidden">
          <aside
            className={`flex h-full flex-col gap-2 border-r bg-card p-3 ${navCollapsed ? "w-16" : "w-56"
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
                      Refinery
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
            {tabs
              .filter((tab) => tab.key !== "settings")
              .map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  className={`h-10 w-full justify-start gap-3 px-3 ${activeView === tab.key ? "bg-accent text-foreground" : ""
                    }`}
                  onClick={() => void requestViewChange(tab.key)}
                >
                  {tab.key === "translate" ? (
                    <Languages className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  ) : null}
                  {tab.key === "history" ? (
                    <History className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  ) : null}
                  {!navCollapsed ? (
                    <span className="text-sm">{tab.label}</span>
                  ) : null}
                </Button>
              ))}
            <div className="flex-1" />
            {tabs
              .filter((tab) => tab.key === "settings")
              .map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  className={`h-10 w-full justify-start gap-3 px-3 ${activeView === tab.key ? "bg-accent text-foreground" : ""
                    }`}
                  onClick={() => void requestViewChange(tab.key)}
                >
                  <Settings className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  {!navCollapsed ? (
                    <span className="text-sm">{tab.label}</span>
                  ) : null}
                </Button>
              ))}
          </aside>

          {activeView === "translate" ? (
            renderScrollableMain(
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
            )
          ) : null}

          {activeView === "history" ? (
            renderScrollableMain(
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pb-4">
                <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-muted-foreground">History</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          viewModel.setHistorySelectMode(!state.historySelectMode)
                        }
                      >
                        {state.historySelectMode ? "Cancel" : "Select"}
                      </Button>
                      {state.historySelectMode ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          disabled={state.historySelectedIds.length === 0}
                          onClick={() => void viewModel.deleteSelectedHistory()}
                        >
                          Delete selected
                        </Button>
                      ) : null}
                      <span className="text-xs text-muted-foreground">Type</span>
                      <Select
                        value={state.historyFilter}
                        onValueChange={(value) =>
                          viewModel.setHistoryFilter(
                            value as typeof state.historyFilter
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {historyTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {!state.historyReady ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : filteredHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No history yet.</p>
                    ) : (
                      filteredHistory.map((item) => {
                        const preview = getHistoryPreview(item);
                        const isExpanded = state.historyExpandedId === item.id;
                        const isSelected = state.historySelectedIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/70 bg-background/60"
                          >
                            <div className="flex w-full items-start justify-between gap-4 px-3 py-2">
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                {state.historySelectMode ? (
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4"
                                    checked={isSelected}
                                    onChange={() =>
                                      viewModel.toggleHistorySelection(item.id)
                                    }
                                    aria-label="Select history item"
                                  />
                                ) : null}
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                                  onClick={() => viewModel.toggleHistoryItem(item.id)}
                                >
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {historyTypeLabel(item.type)}
                                  </span>
                                  <span className="text-sm text-foreground">
                                    {preview || "No preview"}
                                  </span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                  {formatHistoryTime(item.createdAt)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    void viewModel.deleteHistoryItem(item.id)
                                  }
                                  aria-label="Delete history item"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                                </Button>
                              </div>
                            </div>
                            {isExpanded ? (
                              <div className="border-t border-border/70 px-3 pb-3 pt-2">
                                {item.type === "translation" ? (
                                  <div className="flex flex-col gap-3 text-sm">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      <span>
                                        {item.payload.source}
                                        {" -> "}
                                        {item.payload.target}
                                      </span>
                                      {item.payload.detectedSource ? (
                                        <span>
                                          Detected: {item.payload.detectedSource}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="grid gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Input
                                      </span>
                                      <div className="rounded-md bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">
                                        {item.payload.input || "-"}
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Output
                                      </span>
                                      <div className="rounded-md bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">
                                        {item.payload.output || "-"}
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            )
          ) : null}

          {activeView === "settings" ? (
            renderScrollableMain(
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pb-4">
                <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="sticky top-0 self-start rounded-xl border bg-card p-3 shadow-sm">
                    <span className="px-2 text-xs font-medium text-muted-foreground">
                      Settings
                    </span>
                    <button
                      type="button"
                      className={`mt-2 h-9 w-full rounded-md px-3 text-left text-sm ${activeSettingsSection === "appearance"
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      onClick={() =>
                        settingsAppearanceRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        })
                      }
                    >
                      Appearance
                    </button>
                    <button
                      type="button"
                      className={`mt-2 h-9 w-full rounded-md px-3 text-left text-sm ${activeSettingsSection === "llm"
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      onClick={() =>
                        settingsLlmRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        })
                      }
                    >
                      LLM
                    </button>
                    <button
                      type="button"
                      className={`mt-2 h-9 w-full rounded-md px-3 text-left text-sm ${activeSettingsSection === "prompts"
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      onClick={() =>
                        settingsPromptsRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        })
                      }
                    >
                      Prompts
                    </button>
                    <button
                      type="button"
                      className={`mt-2 h-9 w-full rounded-md px-3 text-left text-sm ${activeSettingsSection === "about"
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      onClick={() =>
                        settingsAboutRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        })
                      }
                    >
                      About
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-col gap-4">
                    <section className="flex flex-col gap-6 rounded-xl border bg-card p-4 shadow-sm">
                      <div
                        ref={settingsAppearanceRef}
                        data-section="appearance"
                        className="flex flex-col gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          Appearance
                        </span>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-muted-foreground">
                            Theme
                          </label>
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

                      <div
                        ref={settingsLlmRef}
                        data-section="llm"
                        className="flex flex-col gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          LLM Settings
                        </span>
                        <div className="grid gap-3">
                          <label className="text-xs text-muted-foreground">
                            Base URL
                          </label>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              value={state.settings.baseUrl}
                              onChange={(event) =>
                                viewModel.updateSettings({
                                  baseUrl: event.target.value
                                })
                              }
                              className="flex-1"
                            />
                          </div>
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
                          <label className="text-xs text-muted-foreground">
                            Temperature
                          </label>
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
                          <label className="text-xs text-muted-foreground">
                            Streaming
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={state.settings.stream}
                              onChange={(event) =>
                                viewModel.updateSettings({
                                  stream: event.target.checked
                                })
                              }
                              aria-label="Enable streaming output"
                            />
                            <span className="text-xs text-muted-foreground">
                              Enable streaming output
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">
                              Connection test
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => void handleTestBaseUrl()}
                                disabled={testStatus === "testing"}
                              >
                                {testStatus === "testing" ? "Testing..." : "Test"}
                              </Button>
                              <span
                                className={`text-xs ${testStatus === "ok"
                                    ? "text-emerald-600 dark:text-emerald-300"
                                    : testStatus === "fail"
                                      ? "text-rose-600 dark:text-rose-300"
                                      : "text-muted-foreground"
                                  }`}
                              >
                                {testMessage || "Not tested"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-px w-full bg-border" />

                      <div
                        ref={settingsPromptsRef}
                        data-section="prompts"
                        className="flex flex-col gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          Prompt Templates
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Function: Translate
                        </span>
                        <div className="grid gap-3">
                          <label className="text-xs text-muted-foreground">
                            System prompt
                          </label>
                          <PromptTextarea
                            value={state.settings.prompts.translate.system}
                            onChange={(event) =>
                              viewModel.updateSettings({
                                prompts: {
                                  ...state.settings.prompts,
                                  translate: {
                                    ...state.settings.prompts.translate,
                                    system: event.target.value
                                  }
                                }
                              })
                            }
                            ref={systemPromptRef}
                            rows={4}
                            className="min-h-[120px]"
                          />
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">
                              Insert variable
                            </span>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                                  onClick={() =>
                                    insertPromptVariable("system", "{{source}}")
                                  }
                                >
                                  {"{{source}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Source language code
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/30"
                                  onClick={() =>
                                    insertPromptVariable("system", "{{target}}")
                                  }
                                >
                                  {"{{target}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Target language code
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30"
                                  onClick={() =>
                                    insertPromptVariable("system", "{{text}}")
                                  }
                                >
                                  {"{{text}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Input text
                                </span>
                              </div>
                            </div>
                          </div>
                          <label className="text-xs text-muted-foreground">
                            User prompt
                          </label>
                          <PromptTextarea
                            value={state.settings.prompts.translate.user}
                            onChange={(event) =>
                              viewModel.updateSettings({
                                prompts: {
                                  ...state.settings.prompts,
                                  translate: {
                                    ...state.settings.prompts.translate,
                                    user: event.target.value
                                  }
                                }
                              })
                            }
                            ref={userPromptRef}
                            rows={5}
                            className="min-h-[140px]"
                          />
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">
                              Insert variable
                            </span>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                                  onClick={() =>
                                    insertPromptVariable("user", "{{source}}")
                                  }
                                >
                                  {"{{source}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Source language code
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/30"
                                  onClick={() =>
                                    insertPromptVariable("user", "{{target}}")
                                  }
                                >
                                  {"{{target}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Target language code
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30"
                                  onClick={() =>
                                    insertPromptVariable("user", "{{text}}")
                                  }
                                >
                                  {"{{text}}"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Input text
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {"Variables: {{source}}, {{target}}, {{text}}"}
                          </span>
                        </div>
                      </div>

                      <div className="h-px w-full bg-border" />

                      <div
                        ref={settingsAboutRef}
                        data-section="about"
                        className="flex flex-col gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          About
                        </span>
                        <div className="flex items-center gap-3">
                          <img src={appIcon} alt="App icon" className="h-9 w-9" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {appInfo.productName ?? "Refinery"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appInfo.description ?? "Desktop LLM translation app."}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-2 rounded-lg border bg-background/60 px-4 py-3 text-sm">
                          {aboutItems.map((item) => (
                            <div
                              key={item.label}
                              className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]"
                            >
                              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {item.label}
                              </span>
                              <span className="text-sm text-foreground">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </section>
              </div>
              ,
              settingsScrollRef
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
