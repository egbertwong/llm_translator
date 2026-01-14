import type { HistoryRepository } from "@domain/ports/HistoryRepository";
import type { HistoryItem } from "@domain/models/History";

export class SqliteHistoryRepository implements HistoryRepository {
  async load(): Promise<HistoryItem[]> {
    const raw = await window.electronAPI?.loadHistory?.();
    if (!Array.isArray(raw)) return [];
    return raw as HistoryItem[];
  }

  async save(items: HistoryItem[]): Promise<void> {
    await window.electronAPI?.saveHistory?.(items);
  }
}
