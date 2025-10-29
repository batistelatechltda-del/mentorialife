export class Router {
  private routes: Map<string, () => void>;
  private defaultRoute: string;

  constructor(defaultRoute: string = 'dashboard') {
    this.routes = new Map();
    this.defaultRoute = defaultRoute;
    
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
    
    setTimeout(() => this.handleHashChange(), 0);
  }

  register(path: string, callback: () => void): void {
    this.routes.set(path, callback);
  }

  navigate(path: string): void {
    window.location.hash = `/${path}`;
  }

  private getCurrentRoute(): string {
    return window.location.hash.substring(2) || this.defaultRoute;
  }

  private handleHashChange(): void {
    const route = this.getCurrentRoute();
    const handler = this.routes.get(route);
    
    if (handler) {
      handler();
    } else {
      const defaultHandler = this.routes.get(this.defaultRoute);
      if (defaultHandler) {
        defaultHandler();
      }
    }
  }
}
