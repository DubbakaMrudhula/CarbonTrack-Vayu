import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider } from '../context/AuthContext';
import ActivityLoggingPage from '../pages/ActivityLoggingPage';

const BASE_URL = 'http://localhost:8080/api';

function renderActivityLoggingPage() {
  localStorage.setItem('vayu_token', 'mock-jwt-token');
  localStorage.setItem('vayu_user', JSON.stringify({ id: 1, name: 'Asha Sharma', email: 'asha@vayu.test' }));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ActivityLoggingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ActivityLoggingPage', () => {
  it('renders forms for all four categories across tabs using backend factors and user currency', async () => {
    const user = userEvent.setup();
    renderActivityLoggingPage();

    expect(await screen.findByLabelText(/transport mode/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /electricity/i }));
    expect(screen.getByLabelText(/energy source/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /food/i }));
    expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /shopping/i }));
    expect(screen.getByLabelText(/product category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spend amount \(INR\)/i)).toBeInTheDocument();
  });

  it('validates required fields and positive quantity before submitting', async () => {
    const user = userEvent.setup();
    renderActivityLoggingPage();

    await screen.findByLabelText(/transport mode/i);
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    expect(await screen.findByText('Please select a transport mode.')).toBeInTheDocument();
    expect(screen.getByText('Distance is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/transport mode/i), 'CAR_PETROL');
    await user.type(screen.getByLabelText(/distance \(km\)/i), '-10');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    expect(await screen.findByText('Distance must be a positive number.')).toBeInTheDocument();
  });

  it('displays backend calculated CO2e and resets form on successful submit', async () => {
    const user = userEvent.setup();
    renderActivityLoggingPage();

    const modeSelect = await screen.findByLabelText(/transport mode/i);
    await user.selectOptions(modeSelect, 'CAR_PETROL');
    const distanceInput = screen.getByLabelText(/distance \(km\)/i);
    await user.type(distanceInput, '50');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    expect(await screen.findByText('Activity logged successfully.')).toBeInTheDocument();
    expect(screen.getByText('Emission calculated')).toBeInTheDocument();
    expect(screen.getByText('8.5240 kg')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/transport mode/i)).toHaveValue('');
    });
  });

  it('displays API error alert and keeps input values when submission fails', async () => {
    server.use(
      http.post(`${BASE_URL}/activities`, () => {
        return HttpResponse.json(
          {
            status: 400,
            error: 'Bad Request',
            message: 'Quantity exceeds maximum allowed limit',
            fieldErrors: [{ field: 'quantity', message: 'Server limit exceeded' }]
          },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    renderActivityLoggingPage();

    await user.selectOptions(await screen.findByLabelText(/transport mode/i), 'CAR_PETROL');
    await user.type(screen.getByLabelText(/distance \(km\)/i), '120');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Quantity exceeds maximum allowed limit');
    expect(screen.getByText('Server limit exceeded')).toBeInTheDocument();
    expect(screen.getByLabelText(/distance \(km\)/i)).toHaveValue(120);
  });
});

