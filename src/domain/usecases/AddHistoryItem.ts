import type { HistoryRepository } from "../ports/HistoryRepository";
import type { HistoryItem } from "../models/History";

export class AddHistoryItem {
  constructor(
    private historyRepository: HistoryRepository,
    private maxItems = 200
  ) {}

  async execute(item: HistoryItem): Promise<HistoryItem[]> {
    const items = await this.historyRepository.load();
    const next = [item, ...items].slice(0, this.maxItems);
    await this.historyRepository.save(next);
    return next;
  }
}
