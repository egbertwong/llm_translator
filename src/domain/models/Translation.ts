import type { LanguageCode } from "./Language";

export type TranslationRequest = {
  text: string;
  source: LanguageCode;
  target: LanguageCode;
  onDelta?: (chunk: string) => void;
};

export type TranslationResult = {
  text: string;
  detectedSource?: LanguageCode;
};
