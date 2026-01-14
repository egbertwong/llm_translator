export {};

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      setTitleBarOverlay: (options: { color: string; symbolColor: string; height: number }) => void;
      loadSettings: () => Promise<unknown>;
      saveSettings: (settings: unknown) => Promise<void>;
      loadHistory: () => Promise<unknown>;
      saveHistory: (items: unknown[]) => Promise<void>;
      onMaximizedChange: (handler: (maximized: boolean) => void) => () => void;
    };
  }
}
