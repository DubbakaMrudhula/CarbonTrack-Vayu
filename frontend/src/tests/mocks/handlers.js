import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8080/api';

export const MOCK_FACTORS = [
  {
    activityType: 'CAR_PETROL',
    displayName: 'Petrol Car (Medium)',
    category: 'TRANSPORTATION',
    unit: 'km',
    maxQuantity: 5000
  },
  {
    activityType: 'ELECTRICITY_GRID',
    displayName: 'Grid Electricity (India Average)',
    category: 'ELECTRICITY',
    unit: 'kWh',
    maxQuantity: 10000
  },
  {
    activityType: 'MEAL_VEGETARIAN',
    displayName: 'Vegetarian Meal',
    category: 'FOOD',
    unit: 'serving',
    maxQuantity: 20
  },
  {
    activityType: 'SHOPPING_CLOTHING',
    displayName: 'Clothing & Footwear (INR)',
    category: 'SHOPPING',
    unit: 'INR',
    maxQuantity: 1000000
  }
];

export const MOCK_ACTIVITIES = [
  {
    id: 1,
    category: 'ELECTRICITY',
    activityType: 'ELECTRICITY_GRID',
    displayName: 'Grid Electricity (India Average)',
    quantity: 100,
    unit: 'kWh',
    emissionKgCo2e: 71.6,
    logDate: '2026-11-11',
    notes: 'Home bill'
  },
  {
    id: 2,
    category: 'TRANSPORTATION',
    activityType: 'CAR_PETROL',
    displayName: 'Petrol Car (Medium)',
    quantity: 50,
    unit: 'km',
    emissionKgCo2e: 8.524,
    logDate: '2026-11-11',
    notes: 'Office commute'
  }
];

export const handlers = [
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'wrong@vayu.test' || body.password === 'WrongPass123') {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Invalid email or password', fieldErrors: [] },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      token: 'mock-jwt-token',
      expiresAt: '2026-11-11T16:00:00Z',
      user: {
        id: 1,
        name: 'Asha Sharma',
        email: body.email || 'asha@vayu.test',
        role: 'USER'
      }
    });
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'duplicate@vayu.test') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'Email is already registered: duplicate@vayu.test',
          fieldErrors: []
        },
        { status: 409 }
      );
    }
    return HttpResponse.json(
      {
        token: 'mock-jwt-token',
        expiresAt: '2026-11-11T16:00:00Z',
        user: {
          id: 1,
          name: body.name,
          email: body.email,
          role: 'USER'
        }
      },
      { status: 201 }
    );
  }),

  http.get(`${BASE_URL}/users/me`, () => {
    return HttpResponse.json({
      id: 1,
      name: 'Asha Sharma',
      email: 'asha@vayu.test',
      role: 'USER',
      enabled: true,
      createdAt: '2026-11-01T00:00:00Z'
    });
  }),

  http.get(`${BASE_URL}/users/me/preferences`, () => {
    return HttpResponse.json({
      id: 1,
      country: 'India',
      region: 'Karnataka',
      currency: 'INR',
      dietType: 'VEGETARIAN',
      primaryTransport: 'METRO',
      householdSize: 2,
      focusCategories: 'TRANSPORTATION,ELECTRICITY',
      weeklyTargetKg: 25
    });
  }),

  http.get(`${BASE_URL}/emission-factors`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const filtered = category
      ? MOCK_FACTORS.filter((f) => f.category === category)
      : MOCK_FACTORS;
    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE_URL}/activities`, async ({ request }) => {
    const body = await request.json();
    const factor = MOCK_FACTORS.find((f) => f.activityType === body.activityType);
    const emission = body.activityType === 'ELECTRICITY_GRID'
      ? Number((body.quantity * 0.716).toFixed(4))
      : Number((body.quantity * 0.17048).toFixed(4));
    return HttpResponse.json(
      {
        id: 101,
        category: body.category,
        activityType: body.activityType,
        displayName: factor ? factor.displayName : body.activityType,
        quantity: body.quantity,
        unit: body.unit,
        emissionKgCo2e: emission,
        logDate: body.logDate,
        notes: body.notes || null
      },
      { status: 201 }
    );
  }),

  http.get(`${BASE_URL}/activities`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const items = category
      ? MOCK_ACTIVITIES.filter((a) => a.category === category)
      : MOCK_ACTIVITIES;
    return HttpResponse.json({
      content: items,
      totalElements: items.length,
      totalPages: 1,
      number: 0,
      size: 20
    });
  }),

  http.put(`${BASE_URL}/activities/:id`, async ({ params, request }) => {
    const body = await request.json();
    const existing = MOCK_ACTIVITIES.find((a) => a.id === Number(params.id)) || MOCK_ACTIVITIES[0];
    return HttpResponse.json({
      ...existing,
      quantity: body.quantity,
      logDate: body.logDate,
      notes: body.notes || null,
      emissionKgCo2e: Number((body.quantity * 0.716).toFixed(4))
    });
  }),

  http.delete(`${BASE_URL}/activities/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE_URL}/dashboard/summary`, () => {
    return HttpResponse.json({
      date: '2026-11-11',
      totalEmissionKgCo2e: 80.124,
      totalActivityCount: 2,
      recentActivities: MOCK_ACTIVITIES,
      categoryTotals: [
        { category: 'TRANSPORTATION', totalEmissionKgCo2e: 8.524 },
        { category: 'ELECTRICITY', totalEmissionKgCo2e: 71.6 },
        { category: 'FOOD', totalEmissionKgCo2e: 0 },
        { category: 'SHOPPING', totalEmissionKgCo2e: 0 }
      ]
    });
  })
];

