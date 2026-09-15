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

  it('correctly handles dates preceding amounts without confusing year as amount', () => {
    const res = parser.parse('2025-01-20 Petrol 500');
    expect(res.amount).toBe(500);
    expect(res.date).toBe('2025-01-20');
    expect(res.category).toBe('Transport');
    expect(res.type).toBe('expense');
  });

  it('correctly parses Romanized Nepali date keywords "hijo" and "aaja"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    const resHijo = parser.parse('Hijo momo 200');
    expect(resHijo.amount).toBe(200);
    expect(resHijo.date).toBe(yStr);
    expect(resHijo.category).toBe('Food & Drinks');

    const resAaja = parser.parse('Aaja chiya 30');
    expect(resAaja.amount).toBe(30);
    expect(resAaja.date).toBe(new Date().toISOString().split('T')[0]);
    expect(resAaja.category).toBe('Food & Drinks');
  });

  it('correctly parses Nepali income terms like "talab" and "kamai"', () => {
    const res1 = parser.parse('Talab aayo 45000');
    expect(res1.amount).toBe(45000);
    expect(res1.type).toBe('income');

    const res2 = parser.parse('Freelance kamai 8000');
    expect(res2.amount).toBe(8000);
    expect(res2.type).toBe('income');
    expect(res2.category).toBe('Freelance');
  });

  it('correctly handles custom categories without polluting other parser instances', () => {
    const customParser = new RuleParser([
      {
        name: 'Gym',
        type: 'expense',
        keywords: ['gym', 'workout', 'protein'],
        color: '#FF0000',
        icon: 'Dumbbell'
      }
    ]);

    const resCustom = customParser.parse('Gym membership 3000');
    expect(resCustom.amount).toBe(3000);
    expect(resCustom.category).toBe('Gym');

    // Default parser remains untainted
    const resDefault = parser.parse('Gym membership 3000');
    expect(resDefault.category).not.toBe('Gym');
  });
});
