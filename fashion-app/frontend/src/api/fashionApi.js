import { ERROR_MESSAGES } from '../constants/errors.js';

const API = import.meta.env.VITE_API_URL || '';

export class FashionApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, body, { timeoutMs = 120000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const code = data?.error?.code || 'NETWORK';
      const message = data?.error?.message || ERROR_MESSAGES[code] || ERROR_MESSAGES.NETWORK;
      throw new FashionApiError(code, message, resp.status);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new FashionApiError('NETWORK', 'Yêu cầu quá thời gian chờ.', 408);
    }
    if (err instanceof FashionApiError) throw err;
    throw new FashionApiError('NETWORK', ERROR_MESSAGES.NETWORK, 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function validateFabric(payload) {
  return request('/api/validate-fabric', payload, { timeoutMs: 45000 });
}

export async function generateGarment(payload) {
  return request('/api/generate-garment', payload, { timeoutMs: 120000 });
}

export async function tryOn(personImageBase64, garmentImageBase64) {
  return request('/api/try-on', { personImageBase64, garmentImageBase64 }, { timeoutMs: 180000 });
}

export async function healthCheck() {
  const resp = await fetch(`${API}/api/health`);
  return resp.json();
}
