import { DiContainer } from "./DiContainer";
import { TranslationServiceToken, LanguageDetectorToken, SettingsRepositoryToken, TranslateTextToken, LoadSettingsToken, SaveSettingsToken, TranslatorViewModelToken } from "./tokens";
import { LLMTranslationService } from "@infra/llm/LLMTranslationService";
import { BasicLanguageDetector } from "@infra/lang/BasicLanguageDetector";
import { LocalSettingsRepository } from "@infra/storage/LocalSettingsRepository";
import { TranslateText } from "@domain/usecases/TranslateText";
import { LoadSettings } from "@domain/usecases/LoadSettings";
import { SaveSettings } from "@domain/usecases/SaveSettings";
import { TranslatorViewModel } from "@ui/viewmodels/TranslatorViewModel";

export const container = new DiContainer();

container.register(SettingsRepositoryToken, () => new LocalSettingsRepository());
container.register(TranslationServiceToken, () => new LLMTranslationService(container.resolve(SettingsRepositoryToken)));
container.register(LanguageDetectorToken, () => new BasicLanguageDetector());
container.register(TranslateTextToken, () => new TranslateText(
  container.resolve(TranslationServiceToken),
  container.resolve(LanguageDetectorToken)
));
container.register(LoadSettingsToken, () => new LoadSettings(container.resolve(SettingsRepositoryToken)));
container.register(SaveSettingsToken, () => new SaveSettings(container.resolve(SettingsRepositoryToken)));
container.register(TranslatorViewModelToken, () => new TranslatorViewModel(
  container.resolve(TranslateTextToken),
  container.resolve(LoadSettingsToken),
  container.resolve(SaveSettingsToken)
));
