import type { SettingsRepository } from "../ports/SettingsRepository";
import type { LlmSettings } from "../models/Settings";

export class LoadSettings {
  constructor(private repository: SettingsRepository) {}

  execute(): Promise<LlmSettings> {
    return this.repository.load();
  }
}
