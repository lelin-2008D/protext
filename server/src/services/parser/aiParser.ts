import { Category, ParsedTransaction } from '../../types/index.js';

export interface AIParserConfig {
  apiKey?: string;
  model?: string;
  enabled?: boolean;
}

export class AIParser {
  private config: AIParserConfig;

  constructor(config: AIParserConfig = {}) {
    this.config = config;
  }

  public async parse(input: string, categories?: Category[]): Promise<ParsedTransaction | null> {
    if (!this.config.enabled || !this.config.apiKey) {
      // Pluggable stub for future AI upgrade; returns null so parserService falls back to ruleParser
      return null;
    }

    // Future LLM integration (e.g. Gemini / OpenAI API) can be plugged here effortlessly
    return null;
  }
}
