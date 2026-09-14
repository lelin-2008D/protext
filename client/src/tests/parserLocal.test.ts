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
});
