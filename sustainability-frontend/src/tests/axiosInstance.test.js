import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import axiosInstance from '../api/axiosInstance';

const BASE_URL = 'http://localhost:8080/api';

describe('axiosInstance', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation
    });
  });

  it('attaches Bearer token from localStorage when present', async () => {
    localStorage.setItem('vayu_token', 'test-jwt-123');
    let capturedAuthHeader = null;

    server.use(
      http.get(`${BASE_URL}/test-auth`, ({ request }) => {
        capturedAuthHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    const res = await axiosInstance.get('/test-auth');
    expect(res.data.ok).toBe(true);
    expect(capturedAuthHeader).toBe('Bearer test-jwt-123');
  });

  it('does not attach Authorization header when no token is in localStorage', async () => {
    let capturedAuthHeader = 'initial';

    server.use(
      http.get(`${BASE_URL}/test-public`, ({ request }) => {
        capturedAuthHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    await axiosInstance.get('/test-public');
    expect(capturedAuthHeader).toBeNull();
  });

  it('clears auth storage, redirects to /login, and returns normalized error on 401', async () => {
    localStorage.setItem('vayu_token', 'expired-token');
    localStorage.setItem('vayu_user', JSON.stringify({ id: 1, name: 'Asha' }));

    const mockLocation = { pathname: '/dashboard', href: 'http://localhost:5173/dashboard' };
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: mockLocation
    });

    server.use(
      http.get(`${BASE_URL}/protected-check`, () => {
        return HttpResponse.json(
          { status: 401, message: 'Token expired', fieldErrors: [] },
          { status: 401 }
        );
      })
    );

    await expect(axiosInstance.get('/protected-check')).rejects.toEqual({
      status: 401,
      message: 'Token expired',
      fieldErrors: []
    });

    expect(localStorage.getItem('vayu_token')).toBeNull();
    expect(localStorage.getItem('vayu_user')).toBeNull();
    expect(mockLocation.href).toBe('/login');
  });
});

