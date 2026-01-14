import type { Language, LanguageCode } from "@domain/models/Language";
import { SUPPORTED_LANGUAGES } from "@domain/models/Language";
import type { LlmSettings } from "@domain/models/Settings";
import type { HistoryItem, HistoryType } from "@domain/models/History";
import type { TranslateText } from "@domain/usecases/TranslateText";
import type { LoadSettings } from "@domain/usecases/LoadSettings";
import type { SaveSettings } from "@domain/usecases/SaveSettings";
import type { LoadHistory } from "@domain/usecases/LoadHistory";
import type { AddHistoryItem } from "@domain/usecases/AddHistoryItem";
import type { RemoveHistoryItems } from "@domain/usecases/RemoveHistoryItems";

export type TranslatorState = {
  source: LanguageCode;
  target: LanguageCode;
  input: string;
  output: string;
  detectedSource?: LanguageCode;
  loading: boolean;
  error?: string;
  settings: LlmSettings;
  settingsReady: boolean;
  settingsOpen: boolean;
  themeMode: "system" | "light" | "dark";
  theme: "light" | "dark";
  history: HistoryItem[];
  historyReady: boolean;
  historyFilter: HistoryType | "all";
  historyExpandedId?: string;
  historySelectMode: boolean;
  historySelectedIds: string[];
};

type Subscriber = () => void;

const defaultSettings: LlmSettings = {
  baseUrl: "https://api.openai.com",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.2,
  stream: true,
  prompts: {
    translate: {
      system:
        "You are a precise translation engine. Only return the translated text without extra commentary. Preserve formatting and line breaks.",
      user: "Translate from {{source}} to {{target}}:\n{{text}}"
    }
  }
};

const THEME_MODE_KEY = "llm-translator.theme-mode";

export class TranslatorViewModel {
  private listeners = new Set<Subscriber>();
  private themeMedia?: MediaQueryList;
  private themeListener?: (event: MediaQueryListEvent) => void;
  private state: TranslatorState = {
    source: "auto",
    target: "en",
    input: "",
    output: "",
    loading: false,
    settings: { ...defaultSettings },
    settingsReady: false,
    settingsOpen: false,
    themeMode: "system",
    theme: "dark",
    history: [],
    historyReady: false,
    historyFilter: "all",
    historyExpandedId: undefined,
    historySelectMode: false,
    historySelectedIds: []
  };

  constructor(
    private translateText: TranslateText,
    private loadSettings: LoadSettings,
    private saveSettings: SaveSettings,
    private loadHistory: LoadHistory,
    private addHistoryItem: AddHistoryItem,
    private removeHistoryItems: RemoveHistoryItems
  ) {}

  getState() {
    return this.state;
  }

  subscribe(listener: Subscriber) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(partial: Partial<TranslatorState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener());
  }

  async init() {
    const [settings, themeMode, history] = await Promise.all([
      this.loadSettings.execute(),
      this.loadThemeMode(),
      this.loadHistory.execute()
    ]);
    this.setState({
      settings,
      themeMode,
      settingsReady: true,
      history,
      historyReady: true
    });
    this.applyThemeMode(themeMode);
  }

  getLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  setInput(input: string) {
    this.setState({ input });
  }

  setSource(source: LanguageCode) {
    this.setState({ source });
  }

  setTarget(target: LanguageCode) {
    this.setState({ target });
  }

  swapLanguages() {
    if (this.state.source === "auto") {
      this.setState({ source: "en", target: this.state.target });
      return;
    }
    this.setState({ source: this.state.target, target: this.state.source });
  }

  async translate() {
    if (!this.state.input.trim()) return;
    this.setState({ loading: true, error: undefined, output: "" });
    try {
      const result = await this.translateText.execute({
        text: this.state.input,
        source: this.state.source,
        target: this.state.target,
        onDelta: (chunk) => {
          if (!this.state.settings.stream) return;
          this.setState({ output: `${this.state.output}${chunk}` });
        }
      });
      this.setState({
        output: result.text,
        detectedSource: result.detectedSource,
        loading: false
      });
      await this.pushHistory({
        id: this.createHistoryId(),
        type: "translation",
        createdAt: Date.now(),
        payload: {
          source: this.state.source,
          target: this.state.target,
          detectedSource: result.detectedSource,
          input: this.state.input,
          output: result.text
        }
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Translation failed."
      });
    }
  }

  setSettingsOpen(settingsOpen: boolean) {
    this.setState({ settingsOpen });
  }

  updateSettings(patch: Partial<LlmSettings>) {
    this.setState({ settings: { ...this.state.settings, ...patch } });
  }

  async persistSettings() {
    await this.saveSettings.execute(this.state.settings);
  }

  setThemeMode(themeMode: "system" | "light" | "dark") {
    this.setState({ themeMode });
    localStorage.setItem(THEME_MODE_KEY, themeMode);
    this.applyThemeMode(themeMode);
  }

  setHistoryFilter(filter: HistoryType | "all") {
    this.setState({
      historyFilter: filter,
      historyExpandedId: undefined,
      historySelectedIds: []
    });
  }

  toggleHistoryItem(id: string) {
    this.setState({
      historyExpandedId: this.state.historyExpandedId === id ? undefined : id
    });
  }

  setHistorySelectMode(enabled: boolean) {
    this.setState({
      historySelectMode: enabled,
      historySelectedIds: enabled ? this.state.historySelectedIds : []
    });
  }

  toggleHistorySelection(id: string) {
    const selected = new Set(this.state.historySelectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.setState({ historySelectedIds: Array.from(selected) });
  }

  async deleteHistoryItem(id: string) {
    await this.removeHistory([id]);
  }

  async deleteSelectedHistory() {
    await this.removeHistory(this.state.historySelectedIds);
  }

  private async pushHistory(item: HistoryItem) {
    const history = await this.addHistoryItem.execute(item);
    this.setState({ history });
  }

  private async removeHistory(ids: string[]) {
    if (ids.length === 0) return;
    const history = await this.removeHistoryItems.execute(ids);
    const historyExpandedId =
      this.state.historyExpandedId && ids.includes(this.state.historyExpandedId)
        ? undefined
        : this.state.historyExpandedId;
    const historySelectedIds = this.state.historySelectedIds.filter(
      (id) => !ids.includes(id)
    );
    this.setState({ history, historyExpandedId, historySelectedIds });
  }

  private createHistoryId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private applyTheme(theme: "light" | "dark") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  private applyThemeMode(themeMode: "system" | "light" | "dark") {
    this.detachThemeListener();
    if (themeMode === "system") {
      const media = window.matchMedia?.("(prefers-color-scheme: dark)");
      if (media) {
        const apply = (isDark: boolean) => {
          const theme = isDark ? "dark" : "light";
          this.setState({ theme });
          this.applyTheme(theme);
          this.applyTitleBar(theme);
        };
        apply(media.matches);
        const listener = (event: MediaQueryListEvent) => apply(event.matches);
        media.addEventListener?.("change", listener);
        this.themeMedia = media;
        this.themeListener = listener;
        return;
      }
    }
    const theme = themeMode === "dark" ? "dark" : "light";
    this.setState({ theme });
    this.applyTheme(theme);
    this.applyTitleBar(theme);
  }

  private detachThemeListener() {
    if (this.themeMedia && this.themeListener) {
      this.themeMedia.removeEventListener?.("change", this.themeListener);
    }
    this.themeMedia = undefined;
    this.themeListener = undefined;
  }

  private applyTitleBar(theme: "light" | "dark") {
    const symbolColor = theme === "dark" ? "#f5f6f7" : "#1b1b1f";
    window.electronAPI?.setTitleBarOverlay?.({
      color: "#00000000",
      symbolColor,
      height: 32
    });
  }

  private async loadThemeMode(): Promise<"system" | "light" | "dark"> {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === "system" || saved === "light" || saved === "dark") return saved;
    return "system";
  }
}
