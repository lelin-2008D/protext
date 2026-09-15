import { describe, it, expect } from 'vitest';
import { parseLocalInput } from '../lib/parserLocal.js';

describe('Client Local Parser', () => {
  it('correctly extracts expense transactions', () => {
    const res = parseLocalInput('Coffee 120');
    expect(res.amount).toBe(120);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Food & Drinks');
  });

  it('correctly extracts momo with Rs prefix', () => {
    const res = parseLocalInput('Momo Rs 200');
    expect(res.amount).toBe(200);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Food & Drinks');
  });

  it('correctly parses transport "Paid 50 for bus"', () => {
    const res = parseLocalInput('Paid 50 for bus');
    expect(res.amount).toBe(50);
    expect(res.type).toBe('expense');
    expect(res.category).toBe('Transport');
  });

  it('correctly parses income "Received salary 15000"', () => {
    const res = parseLocalInput('Received salary 15000');
    expect(res.amount).toBe(15000);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Salary');
  });

  it('correctly parses gift "Dad gave me 2000"', () => {
    const res = parseLocalInput('Dad gave me 2000');
    expect(res.amount).toBe(2000);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Gift');
  });

  it('correctly parses freelance "Got 500 from freelancing"', () => {
    const res = parseLocalInput('Got 500 from freelancing');
    expect(res.amount).toBe(500);
    expect(res.type).toBe('income');
    expect(res.category).toBe('Freelance');
  });

  it('correctly isolates date when date precedes amount', () => {
    const res = parseLocalInput('2025-01-20 Petrol 500');
    expect(res.amount).toBe(500);
    expect(res.date).toBe('2025-01-20');
    expect(res.category).toBe('Transport');
    expect(res.type).toBe('expense');
  });

  it('correctly parses Romanized Nepali date keywords "hijo" and "aaja"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    const resHijo = parseLocalInput('Hijo momo 200');
    expect(resHijo.amount).toBe(200);
    expect(resHijo.date).toBe(yStr);

    const resAaja = parseLocalInput('Aaja chiya 30');
    expect(resAaja.amount).toBe(30);
    expect(resAaja.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('correctly parses Nepali income terms like "talab" and "kamai"', () => {
    const res1 = parseLocalInput('Talab 35000');
    expect(res1.amount).toBe(35000);
    expect(res1.type).toBe('income');

    const res2 = parseLocalInput('Client kamai 6000');
    expect(res2.amount).toBe(6000);
    expect(res2.type).toBe('income');
  });
});
