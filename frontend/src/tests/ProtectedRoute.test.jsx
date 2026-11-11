import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../routes/ProtectedRoute';

function renderWithRouter(initialEntries = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page Sentinel</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', async () => {
    localStorage.clear();
    renderWithRouter(['/dashboard']);
    expect(await screen.findByText('Login Page Sentinel')).toBeInTheDocument();
  });

  it('renders protected child route when authenticated', async () => {
    localStorage.setItem('vayu_token', 'valid-token');
    localStorage.setItem('vayu_user', JSON.stringify({ id: 1, name: 'Asha Sharma', email: 'asha@vayu.test' }));

    renderWithRouter(['/dashboard']);
    expect(await screen.findByText('Protected Dashboard Content')).toBeInTheDocument();
  });
});

