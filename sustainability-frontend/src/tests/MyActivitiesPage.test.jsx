import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { MOCK_ACTIVITIES } from './mocks/handlers';
import MyActivitiesPage from '../pages/MyActivitiesPage';

const BASE_URL = 'http://localhost:8080/api';

function renderMyActivitiesPage() {
  localStorage.setItem('vayu_token', 'mock-jwt-token');
  return render(
    <MemoryRouter>
      <MyActivitiesPage />
    </MemoryRouter>
  );
}

describe('MyActivitiesPage', () => {
  it('renders activity rows formatted from backend data', async () => {
    renderMyActivitiesPage();

    expect(await screen.findByText('Grid Electricity (India Average)')).toBeInTheDocument();
    expect(screen.getByText('Petrol Car (Medium)')).toBeInTheDocument();
    expect(screen.getByText('71.6000')).toBeInTheDocument();
    expect(screen.getByText('8.5240')).toBeInTheDocument();
    expect(screen.getAllByText('11/11/2026').length).toBe(2);
  });

  it('filters activities by category when filter selection changes', async () => {
    const user = userEvent.setup();
    renderMyActivitiesPage();

    await screen.findByText('Grid Electricity (India Average)');
    await user.selectOptions(screen.getByLabelText(/^category$/i), 'TRANSPORTATION');

    await waitFor(() => {
      expect(screen.queryByText('Grid Electricity (India Average)')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Petrol Car (Medium)')).toBeInTheDocument();
  });

  it('opens edit modal, submits PUT update, and refreshes the table', async () => {
    let activitiesState = [...MOCK_ACTIVITIES];
    server.use(
      http.get(`${BASE_URL}/activities`, () => {
        return HttpResponse.json({
          content: activitiesState,
          totalElements: activitiesState.length,
          totalPages: 1,
          number: 0,
          size: 20
        });
      }),
      http.put(`${BASE_URL}/activities/:id`, async ({ params, request }) => {
        const body = await request.json();
        activitiesState = activitiesState.map((item) =>
          item.id === Number(params.id)
            ? { ...item, quantity: body.quantity, emissionKgCo2e: Number((body.quantity * 0.716).toFixed(4)) }
            : item
        );
        return HttpResponse.json(activitiesState[0]);
      })
    );

    const user = userEvent.setup();
    renderMyActivitiesPage();

    const editBtn = await screen.findByRole('button', { name: 'Edit Grid Electricity (India Average)' });
    await user.click(editBtn);

    const dialog = await screen.findByRole('dialog');
    const qtyInput = within(dialog).getByLabelText(/quantity \(kWh\)/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, '200');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('143.2000')).toBeInTheDocument();
  });

  it('opens delete confirmation modal, submits DELETE, and removes activity', async () => {
    let activitiesState = [...MOCK_ACTIVITIES];
    server.use(
      http.get(`${BASE_URL}/activities`, () => {
        return HttpResponse.json({
          content: activitiesState,
          totalElements: activitiesState.length,
          totalPages: 1,
          number: 0,
          size: 20
        });
      }),
      http.delete(`${BASE_URL}/activities/:id`, ({ params }) => {
        activitiesState = activitiesState.filter((item) => item.id !== Number(params.id));
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderMyActivitiesPage();

    const deleteBtn = await screen.findByRole('button', { name: 'Delete Grid Electricity (India Average)' });
    await user.click(deleteBtn);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Grid Electricity (India Average)')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Petrol Car (Medium)')).toBeInTheDocument();
  });
});

