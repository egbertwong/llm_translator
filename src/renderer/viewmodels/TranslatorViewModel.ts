import type { Language, LanguageCode } from "@domain/models/Language";
import { SUPPORTED_LANGUAGES } from "@domain/models/Language";
import type { LlmSettings } from "@domain/models/Settings";
import type { TranslateText } from "@domain/usecases/TranslateText";
import type { LoadSettings } from "@domain/usecases/LoadSettings";
import type { SaveSettings } from "@domain/usecases/SaveSettings";

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
    theme: "dark"
  };

  constructor(
    private translateText: TranslateText,
    private loadSettings: LoadSettings,
    private saveSettings: SaveSettings
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
    const [settings, themeMode] = await Promise.all([
      this.loadSettings.execute(),
      this.loadThemeMode()
    ]);
    this.setState({ settings, themeMode, settingsReady: true });
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
