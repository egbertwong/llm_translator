import type { TranslationService } from "@domain/ports/TranslationService";
import type { SettingsRepository } from "@domain/ports/SettingsRepository";
import type { TranslationRequest, TranslationResult } from "@domain/models/Translation";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class LLMTranslationService implements TranslationService {
  constructor(private settingsRepository: SettingsRepository) {}

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const settings = await this.settingsRepository.load();
    const base = settings.baseUrl.replace(/\/$/, "");
    const url = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

    const system = [
      "You are a precise translation engine.",
      "Only return the translated text without extra commentary.",
      "Preserve formatting and line breaks."
    ].join(" ");

    const user = `Translate from ${request.source} to ${request.target}:\n${request.text}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: settings.apiKey ? `Bearer ${settings.apiKey}` : ""
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: settings.temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`LLM request failed (${response.status}): ${detail}`);
    }

    const payload = (await response.json()) as OpenAIChatResponse;
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  }
}
