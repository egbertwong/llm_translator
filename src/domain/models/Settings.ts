export type LlmSettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  stream: boolean;
  prompts: PromptProfiles;
};

export type PromptTemplate = {
  system: string;
  user: string;
};

export type PromptProfiles = {
  translate: PromptTemplate;
};
