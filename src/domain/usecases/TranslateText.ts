import type { TranslationService } from "../ports/TranslationService";
import type { LanguageDetector } from "../ports/LanguageDetector";
import type { TranslationRequest, TranslationResult } from "../models/Translation";

export class TranslateText {
  constructor(
    private translationService: TranslationService,
    private detector: LanguageDetector
  ) {}

  async execute(request: TranslationRequest): Promise<TranslationResult> {
    let source = request.source;
    let detectedSource: TranslationResult["detectedSource"];

    if (request.source === "auto") {
      detectedSource = await this.detector.detect(request.text);
      source = detectedSource;
    }

    const result = await this.translationService.translate({
      ...request,
      source
    });

    return {
      ...result,
      detectedSource: detectedSource ?? result.detectedSource
    };
  }
}
