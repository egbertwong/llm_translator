import type { LanguageCode } from "./Language";

export type TranslationRequest = {
  text: string;
  source: LanguageCode;
  target: LanguageCode;
};

export type TranslationResult = {
  text: string;
  detectedSource?: LanguageCode;
};
