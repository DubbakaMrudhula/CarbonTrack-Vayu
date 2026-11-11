import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';

const BASE_URL = 'http://localhost:8080/api';

function renderDashboardPage() {
  localStorage.setItem('vayu_token', 'mock-jwt-token');
  localStorage.setItem(
    'vayu_user',
    JSON.stringify({ id: 1, name: 'Asha Sharma', email: 'asha@vayu.test' })
  );
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  it('renders empty state with zeros and no invented figures when no activities exist', async () => {
    server.use(
      http.get(`${BASE_URL}/dashboard/summary`, () => {
        return HttpResponse.json({
          date: '2026-11-11',
          totalEmissionKgCo2e: 0,
          totalActivityCount: 0,
          recentActivities: [],
          categoryTotals: [
            { category: 'TRANSPORTATION', totalEmissionKgCo2e: 0 },
            { category: 'ELECTRICITY', totalEmissionKgCo2e: 0 },
            { category: 'FOOD', totalEmissionKgCo2e: 0 },
            { category: 'SHOPPING', totalEmissionKgCo2e: 0 }
          ]
        });
      })
    );

    renderDashboardPage();

    expect(await screen.findByText('Welcome, Asha Sharma')).toBeInTheDocument();
    expect(screen.getByText('0.0000 kg')).toBeInTheDocument();
    expect(screen.getByText('No activities logged yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log your first activity/i })).toBeInTheDocument();
  });

  it('renders populated stats, category totals, and recent activities from backend', async () => {
    renderDashboardPage();

    expect(await screen.findByText('Welcome, Asha Sharma')).toBeInTheDocument();
    expect(screen.getByText('80.1240 kg')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('71.6000 kg')).toBeInTheDocument();
    expect(screen.getByText('8.5240 kg')).toBeInTheDocument();
    expect(screen.getByText('Grid Electricity (India Average)')).toBeInTheDocument();
    expect(screen.getByText('Petrol Car (Medium)')).toBeInTheDocument();
  });
});

