import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider } from '../context/AuthContext';
import RegisterPage from '../pages/RegisterPage';

const BASE_URL = 'http://localhost:8080/api';

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
          <Route path="/privacy" element={<div>Privacy Policy</div>} />
          <Route path="/terms" element={<div>Terms of Service</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  it('blocks submit and displays error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Asha Sharma');
    await user.type(screen.getByLabelText(/email address/i), 'asha@vayu.test');
    await user.type(screen.getByLabelText(/^password/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Landing')).not.toBeInTheDocument();
  });

  it('blocks submit when terms checkbox is unchecked', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Asha Sharma');
    await user.type(screen.getByLabelText(/email address/i), 'asha@vayu.test');
    await user.type(screen.getByLabelText(/^password/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('You must accept the terms to continue.')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Landing')).not.toBeInTheDocument();
  });

  it('displays duplicate email error returned by API on 409 conflict', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Asha Sharma');
    await user.type(screen.getByLabelText(/email address/i), 'duplicate@vayu.test');
    await user.type(screen.getByLabelText(/^password/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const matches = await screen.findAllByText(/Email is already registered: duplicate@vayu\.test/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('maps backend fieldErrors onto corresponding form inputs', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/register`, () => {
        return HttpResponse.json(
          {
            status: 400,
            error: 'Bad Request',
            message: 'Validation failed for one or more fields',
            fieldErrors: [
              { field: 'email', message: 'Server rejected email domain' },
              { field: 'password', message: 'Server password policy violation' }
            ]
          },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Asha Sharma');
    await user.type(screen.getByLabelText(/email address/i), 'asha@vayu.test');
    await user.type(screen.getByLabelText(/^password/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Server rejected email domain')).toBeInTheDocument();
    expect(screen.getByText('Server password policy violation')).toBeInTheDocument();
  });
});

