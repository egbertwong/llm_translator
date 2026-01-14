import type { HistoryRepository } from "../ports/HistoryRepository";
import type { HistoryItem } from "../models/History";

export class RemoveHistoryItems {
  constructor(private historyRepository: HistoryRepository) {}

  async execute(ids: string[]): Promise<HistoryItem[]> {
    if (ids.length === 0) return this.historyRepository.load();
    const items = await this.historyRepository.load();
    const next = items.filter((item) => !ids.includes(item.id));
    await this.historyRepository.save(next);
    return next;
  }
}
