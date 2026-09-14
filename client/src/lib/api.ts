import { ParsedTransaction, Transaction, UserSettings, Category } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export class ApiService {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // Health check
  static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // NLP Parse
  static async parseText(text: string, customCategories?: Category[]): Promise<ParsedTransaction> {
    const res = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text, customCategories })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to parse text on server');
    }
    return data.data;
  }

  // Transactions
  static async getTransactions(params?: { type?: string; category?: string; search?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const url = `${API_BASE}/api/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch transactions');
    }
    return data.data;
  }

  static async createTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tx)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create transaction');
    }
    return data.data;
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update transaction');
    }
    return data.data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete transaction');
    }
  }

  // Settings
  static async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch settings');
    }
    return data.data;
  }

  static async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update settings');
    }
    return data.data;
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch categories');
    }
    return data.data;
  }

  static async createCategory(cat: Omit<Category, 'id' | 'user_id'>): Promise<Category> {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(cat)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create category');
    }
    return data.data;
  }
}
