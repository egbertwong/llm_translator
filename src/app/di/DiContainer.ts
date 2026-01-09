export type Token<T> = symbol & { __type?: T };

export class DiContainer {
  private factories = new Map<Token<unknown>, () => unknown>();
  private singletons = new Map<Token<unknown>, unknown>();

  register<T>(token: Token<T>, factory: () => T, singleton = true) {
    this.factories.set(token, factory);
    if (!singleton) {
      this.singletons.delete(token);
    }
  }

  resolve<T>(token: Token<T>): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error("Missing dependency registration.");
    }
    const instance = factory() as T;
    this.singletons.set(token, instance);
    return instance;
  }
}
