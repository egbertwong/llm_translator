import type { LlmSettings } from "../models/Settings";

export interface SettingsRepository {
  load(): Promise<LlmSettings>;
  save(settings: LlmSettings): Promise<void>;
}
