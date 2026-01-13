import { DiContainer } from "./DiContainer";
import {
  TranslationServiceToken,
  LanguageDetectorToken,
  SettingsRepositoryToken,
  HistoryRepositoryToken,
  TranslateTextToken,
  LoadSettingsToken,
  SaveSettingsToken,
  LoadHistoryToken,
  AddHistoryItemToken,
  TranslatorViewModelToken
} from "./tokens";
import { LLMTranslationService } from "@infra/llm/LLMTranslationService";
import { BasicLanguageDetector } from "@infra/lang/BasicLanguageDetector";
import { LocalSettingsRepository } from "@infra/storage/LocalSettingsRepository";
import { LocalHistoryRepository } from "@infra/storage/LocalHistoryRepository";
import { TranslateText } from "@domain/usecases/TranslateText";
import { LoadSettings } from "@domain/usecases/LoadSettings";
import { SaveSettings } from "@domain/usecases/SaveSettings";
import { LoadHistory } from "@domain/usecases/LoadHistory";
import { AddHistoryItem } from "@domain/usecases/AddHistoryItem";
import { TranslatorViewModel } from "@ui/viewmodels/TranslatorViewModel";

export const container = new DiContainer();

container.register(SettingsRepositoryToken, () => new LocalSettingsRepository());
container.register(HistoryRepositoryToken, () => new LocalHistoryRepository());
container.register(TranslationServiceToken, () => new LLMTranslationService(container.resolve(SettingsRepositoryToken)));
container.register(LanguageDetectorToken, () => new BasicLanguageDetector());
container.register(TranslateTextToken, () => new TranslateText(
  container.resolve(TranslationServiceToken),
  container.resolve(LanguageDetectorToken)
));
container.register(LoadSettingsToken, () => new LoadSettings(container.resolve(SettingsRepositoryToken)));
container.register(SaveSettingsToken, () => new SaveSettings(container.resolve(SettingsRepositoryToken)));
container.register(LoadHistoryToken, () => new LoadHistory(container.resolve(HistoryRepositoryToken)));
container.register(AddHistoryItemToken, () => new AddHistoryItem(container.resolve(HistoryRepositoryToken)));
container.register(TranslatorViewModelToken, () => new TranslatorViewModel(
  container.resolve(TranslateTextToken),
  container.resolve(LoadSettingsToken),
  container.resolve(SaveSettingsToken),
  container.resolve(LoadHistoryToken),
  container.resolve(AddHistoryItemToken)
));
