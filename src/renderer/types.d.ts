export {};

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      setTitleBarOverlay: (options: { color: string; symbolColor: string; height: number }) => void;
      onMaximizedChange: (handler: (maximized: boolean) => void) => () => void;
    };
  }
}
