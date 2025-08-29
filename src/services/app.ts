import { createTools, ToolsFactory } from '../mcp/tools';
import { loadConfig, Config } from '../config';

/**
 * Singleton service to manage application dependencies
 * Prevents redundant tool creation and configuration loading
 */
class ApplicationService {
  private static instance: ApplicationService;
  private _config?: Config;
  private _tools?: ToolsFactory;

  private constructor() {}

  static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  get config(): Config {
    if (!this._config) {
      this._config = loadConfig();
    }
    return this._config;
  }

  get tools(): ToolsFactory {
    if (!this._tools) {
      this._tools = createTools(this.config.modelPath);
    }
    return this._tools;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  reset(): void {
    this._config = undefined;
    this._tools = undefined;
  }
}

export const appService = ApplicationService.getInstance();
