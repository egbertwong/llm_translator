import type { LanguageDetector } from "@domain/ports/LanguageDetector";
import type { LanguageCode } from "@domain/models/Language";

export class BasicLanguageDetector implements LanguageDetector {
  async detect(text: string): Promise<LanguageCode> {
    if (/[\u4e00-\u9fff]/.test(text)) return "zh";
    if (/[\u3040-\u30ff]/.test(text)) return "ja";
    if (/[\uac00-\ud7af]/.test(text)) return "ko";
    if (/[а-яА-Я]/.test(text)) return "ru";
    return "en";
  }
}
