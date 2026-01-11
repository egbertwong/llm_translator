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

type OpenAIChatStreamResponse = {
  choices?: Array<{
    delta?: {
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
        stream: settings.stream,
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

    const contentType = response.headers.get("content-type") ?? "";
    if (settings.stream && response.body && contentType.includes("text/event-stream")) {
      const text = await this.readStream(response.body, request.onDelta);
      return { text };
    }

    const payload = (await response.json()) as OpenAIChatResponse;
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  }

  private async readStream(
    body: ReadableStream<Uint8Array>,
    onDelta?: (chunk: string) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");
      while (lineBreakIndex >= 0) {
        const line = buffer.slice(0, lineBreakIndex).trim();
        buffer = buffer.slice(lineBreakIndex + 1);
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") return text;
          try {
            const payload = JSON.parse(data) as OpenAIChatStreamResponse;
            const delta = payload.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              text += delta;
              onDelta?.(delta);
            }
          } catch {
            // Ignore malformed chunks.
          }
        }
        lineBreakIndex = buffer.indexOf("\n");
      }
    }

    return text;
  }
}
