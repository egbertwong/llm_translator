import type { TranslationRequest, TranslationResult } from "../models/Translation";

export interface TranslationService {
  translate(request: TranslationRequest): Promise<TranslationResult>;
}
