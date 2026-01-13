import type { LanguageCode } from "./Language";

export type HistoryType = "translation";

export type TranslationHistoryPayload = {
  source: LanguageCode;
  target: LanguageCode;
  detectedSource?: LanguageCode;
  input: string;
  output: string;
};

export type HistoryItem = {
  id: string;
  type: HistoryType;
  createdAt: number;
  payload: TranslationHistoryPayload;
};
