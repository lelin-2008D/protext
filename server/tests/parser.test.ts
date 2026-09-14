import { describe, it, expect } from 'vitest';
import { RuleParser } from '../src/services/parser/ruleParser.js';

describe('Transaction RuleParser', () => {
  const parser = new RuleParser();

  it('correctly parses "Coffee 120"', () => {
    const res = parser.parse('Coffee 120');
    expect(res.amount).toBe(120);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Food & Drinks');
    expect(res.description.toLowerCase()).toContain('coffee');
    expect(res.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('correctly parses "Momo Rs 200"', () => {
    const res = parser.parse('Momo Rs 200');
    expect(res.amount).toBe(200);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Food & Drinks');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly parses "Paid 50 for bus"', () => {
    const res = parser.parse('Paid 50 for bus');
    expect(res.amount).toBe(50);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Transport');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly parses "Bought books for 450"', () => {
    const res = parser.parse('Bought books for 450');
    expect(res.amount).toBe(450);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Education');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly parses "Received salary 15000"', () => {
    const res = parser.parse('Received salary 15000');
    expect(res.amount).toBe(15000);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Salary');
    expect(res.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('correctly parses "Dad gave me 2000"', () => {
    const res = parser.parse('Dad gave me 2000');
    expect(res.amount).toBe(2000);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Gift');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly parses "Got 500 from freelancing"', () => {
    const res = parser.parse('Got 500 from freelancing');
    expect(res.amount).toBe(500);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Freelance');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly parses comma-formatted amounts like "1,500"', () => {
    const res = parser.parse('Bought jacket Rs 1,500');
    expect(res.amount).toBe(1500);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Shopping');
  });

  it('correctly parses k suffix amounts like "15k"', () => {
    const res = parser.parse('Salary 25k');
    expect(res.amount).toBe(25000);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Salary');
  });

  it('handles ambiguous transactions with lower confidence', () => {
    const res = parser.parse('Random item 300');
    expect(res.amount).toBe(300);
    expect(res.category).toBe('Other');
    expect(res.confidence).toBeLessThan(0.7);
  });

  it('returns 0 amount and 0 confidence for empty or invalid text', () => {
    const res = parser.parse('');
    expect(res.amount).toBe(0);
    expect(res.confidence).toBe(0);
  });
});
