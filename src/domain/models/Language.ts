export type LanguageCode =
  | "auto"
  | "en"
  | "zh"
  | "ja"
  | "ko"
  | "fr"
  | "de"
  | "es"
  | "ru"
  | "it"
  | "pt";

export type Language = {
  code: LanguageCode;
  label: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "auto", label: "Auto Detect" },
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "ru", label: "Russian" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" }
];
