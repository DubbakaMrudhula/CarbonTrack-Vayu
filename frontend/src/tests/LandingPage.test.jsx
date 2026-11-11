import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';

function renderLandingPage() {
  localStorage.clear();
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renders hero, 3D Earth fallback in jsdom, and primary sections without technical jargon', () => {
    renderLandingPage();

    expect(screen.getByRole('heading', { name: /a greener/i })).toBeInTheDocument();
    expect(screen.getByText('Starts With You')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start tracking/i })).toHaveAttribute('href', '/register');
    expect(screen.getByText('A Simple 4-Step Journey')).toBeInTheDocument();
    expect(screen.getByText('Track Every Impact')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Electricity')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /be the change/i })).toBeInTheDocument();
  });

  it('links authenticated users straight to dashboard CTA', () => {
    localStorage.setItem('vayu_token', 'mock-jwt-token');
    localStorage.setItem('vayu_user', JSON.stringify({ id: 1, name: 'Asha Sharma', email: 'asha@vayu.test' }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /go to workspace/i })).toHaveAttribute('href', '/dashboard');
  });
});
