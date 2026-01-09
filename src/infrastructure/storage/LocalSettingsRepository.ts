import type { SettingsRepository } from "@domain/ports/SettingsRepository";
import type { LlmSettings } from "@domain/models/Settings";

const STORAGE_KEY = "llm-translator.settings";

const defaultSettings: LlmSettings = {
  baseUrl: "https://api.openai.com",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.2
};

export class LocalSettingsRepository implements SettingsRepository {
  async load(): Promise<LlmSettings> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    try {
      const parsed = JSON.parse(raw) as Partial<LlmSettings>;
      return {
        ...defaultSettings,
        ...parsed
      };
    } catch {
      return { ...defaultSettings };
    }
  }

  async save(settings: LlmSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
