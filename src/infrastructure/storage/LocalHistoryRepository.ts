import type { HistoryRepository } from "@domain/ports/HistoryRepository";
import type { HistoryItem } from "@domain/models/History";

const STORAGE_KEY = "refinery.history";

export class LocalHistoryRepository implements HistoryRepository {
  async load(): Promise<HistoryItem[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  async save(items: HistoryItem[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}
