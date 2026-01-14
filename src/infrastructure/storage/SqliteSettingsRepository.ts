import type { SettingsRepository } from "@domain/ports/SettingsRepository";
import type { LlmSettings } from "@domain/models/Settings";

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

export class SqliteSettingsRepository implements SettingsRepository {
  async load(): Promise<LlmSettings> {
    const raw = await window.electronAPI?.loadSettings?.();
    if (!raw || typeof raw !== "object") return { ...defaultSettings };
    return {
      ...defaultSettings,
      ...(raw as Partial<LlmSettings>)
    };
  }

  async save(settings: LlmSettings): Promise<void> {
    await window.electronAPI?.saveSettings?.(settings);
  }
}
