import type { HistoryRepository } from "../ports/HistoryRepository";
import type { HistoryItem } from "../models/History";

export class LoadHistory {
  constructor(private historyRepository: HistoryRepository) {}

  async execute(): Promise<HistoryItem[]> {
    return this.historyRepository.load();
  }
}
