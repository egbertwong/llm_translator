import type { HistoryItem } from "../models/History";

export interface HistoryRepository {
  load(): Promise<HistoryItem[]>;
  save(items: HistoryItem[]): Promise<void>;
}
