import type { SettingsRepository } from "../ports/SettingsRepository";
import type { LlmSettings } from "../models/Settings";

export class SaveSettings {
  constructor(private repository: SettingsRepository) {}

  execute(settings: LlmSettings): Promise<void> {
    return this.repository.save(settings);
  }
}
