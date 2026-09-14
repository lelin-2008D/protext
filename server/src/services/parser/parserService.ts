import { Category, ParsedTransaction } from '../../types/index.js';
import { RuleParser } from './ruleParser.js';
import { AIParser } from './aiParser.js';

export class ParserService {
  private ruleParser: RuleParser;
  private aiParser: AIParser;

  constructor(customCategories?: Category[], aiConfig?: { apiKey?: string; enabled?: boolean }) {
    this.ruleParser = new RuleParser(customCategories);
    this.aiParser = new AIParser(aiConfig);
  }

  public async parse(input: string, customCategories?: Category[]): Promise<ParsedTransaction> {
    if (customCategories && customCategories.length > 0) {
      this.ruleParser = new RuleParser(customCategories);
    }

    // Try AI parser if enabled
    const aiResult = await this.aiParser.parse(input, customCategories);
    if (aiResult) {
      return aiResult;
    }

    // Default to deterministic rule parser
    return this.ruleParser.parse(input);
  }
}

export const defaultParserService = new ParserService();
