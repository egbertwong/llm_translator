import type { LanguageCode } from "../models/Language";

export interface LanguageDetector {
  detect(text: string): Promise<LanguageCode>;
}
