# Vayu: Sustainability Analytics and Carbon Emission Monitoring Platform

Vayu (वायु): Vayu means air in Sanskrit.

Log daily activities and see your carbon footprint in kg CO2e.

## Scope Notice (Weeks 1 and 2)

This repository implements the Weeks 1 and 2 foundation: PostgreSQL schema managed with Flyway, JPA entities, JWT authentication, user profile and sustainability preferences, activity logging CRUD, deterministic emission calculation, and the React frontend. Advanced analytics, Redis caching, recommendations, goal calculation logic, peer benchmarking, leaderboards, and Recharts visualizations are out of scope at this stage. Goals, Insights, and Leaderboard pages are placeholder routes.

## Prerequisites

Install and verify the following tools:

1. **Java Development Kit (JDK) 21 or newer**: verify with `java -version`
2. **Apache Maven 3.9+** (or use the included Maven wrapper `mvnw` / `mvnw.cmd`): verify with `.\mvnw.cmd -v`
3. **Node.js LTS (v20+) and npm**: verify with `node -v` and `npm -v`
4. **Docker Desktop or Docker Engine with Docker Compose**: verify with `docker --version` and `docker compose version`
5. **Git 2.40+**: verify with `git --version`

## Setup and Environment Variables

Copy `.env.example` to `.env` inside `sustainability-platform`:

```powershell
Copy-Item .env.example .env
```

Environment variables for PostgreSQL and Spring Boot (`.env`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `vayu` | PostgreSQL database name |
| `POSTGRES_USER` | `vayu_user` | PostgreSQL application role |
| `POSTGRES_PASSWORD` | `vayu_password` | PostgreSQL password (change outside local dev) |
| `POSTGRES_PORT` | `5432` | Exposed host port for PostgreSQL |
| `SERVER_PORT` | `8080` | Spring Boot HTTP server port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma separated allowed frontend origins |
| `JWT_SECRET` | Local dev key in `.env.example` | HMAC SHA 256 signing key (minimum 32 characters) |
| `JWT_EXPIRATION_MS` | `3600000` | Token validity in milliseconds (1 hour) |

Frontend environment configuration (`sustainability-frontend/.env.development`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL for Axios API requests |

## Running the Platform

### 1. Start the Database (PostgreSQL)

From `sustainability-platform`:

```powershell
docker compose up -d
```

Verify container health and inspect Flyway migrations once the backend has started:

```powershell
docker exec -it vayu-postgres psql -U vayu_user -d vayu -c "\dt"
docker exec -it vayu-postgres psql -U vayu_user -d vayu -c "SELECT version, description, success FROM flyway_schema_history;"
```

### 2. Start the Backend (Spring Boot)

From `sustainability-platform/sustainability-backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

On macOS or Linux:

```bash
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080`. Health check: `GET http://localhost:8080/actuator/health`.

### 3. Start the Frontend (React and Vite)

From `sustainability-platform/sustainability-frontend`:

```powershell
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` with no Vite proxy. Cross origin requests are handled by `CorsConfig` in the backend.

## Running Tests

### Backend Tests (JUnit 5, Mockito, MockMvc, Testcontainers)

Docker must be running for Testcontainers integration tests (`DatabaseConstraintIntegrationTest`, `ActivityIntegrationTest`, `FullWorkflowIntegrationTest`).

Run the entire backend suite from `sustainability-backend`:

```powershell
.\mvnw.cmd test
```

Run unit and MockMvc tests only (excluding Testcontainers classes):

```powershell
.\mvnw.cmd test -Dtest="!*IntegrationTest"
```

### Frontend Tests (Vitest, React Testing Library, MSW)

From `sustainability-frontend`:

```powershell
npm test -- --run
```

## API Endpoint Reference

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register a user, accept terms, create default India preferences (`201 Created`) |
| `POST` | `/api/auth/login` | No | Authenticate and issue JWT Bearer token (`200 OK`) |
| `GET` | `/api/users/me` | Yes | Fetch authenticated user profile (`200 OK`) |
| `PUT` | `/api/users/me` | Yes | Update user display name (`200 OK`) |
| `GET` | `/api/users/me/preferences` | Yes | Fetch sustainability preferences (`200 OK`) |
| `PUT` | `/api/users/me/preferences` | Yes | Update country, region, currency, diet, transport, household size, targets (`200 OK`) |
| `PATCH` | `/api/users/me/password` | Yes | Verify current password and update password hash (`204 No Content`) |
| `DELETE` | `/api/users/me` | Yes | Verify password and permanently delete account and cascaded logs (`204 No Content`) |
| `GET` | `/api/emission-factors` | Yes | List active emission factors, optionally filtered by `category` (`200 OK`) |
| `POST` | `/api/activities` | Yes | Log an activity and compute CO2e server side (`201 Created`) |
| `GET` | `/api/activities` | Yes | Paginated list of user activities with optional `category`, `from`, `to` filters (`200 OK`) |
| `GET` | `/api/activities/{id}` | Yes | Fetch single activity owned by user (`200 OK`) |
| `PUT` | `/api/activities/{id}` | Yes | Replace activity inputs and recalculate emissions (`200 OK`) |
| `PATCH` | `/api/activities/{id}` | Yes | Partially update activity and recalculate if quantity/type/unit/category changed (`200 OK`) |
| `DELETE` | `/api/activities/{id}` | Yes | Delete user activity (`204 No Content`) |
| `GET` | `/api/dashboard/summary` | Yes | Daily CO2e total, total count, category totals, and 5 recent logs for `date` (`200 OK`) |
| `GET` | `/actuator/health` | No | Service health endpoint (`200 OK`) |

## How Data Flows from React to Spring Boot to PostgreSQL and Back

1. **User interaction in React**: The user selects a category tab (for example, `TRANSPORTATION`) on `ActivityLoggingPage`, picks an active activity type loaded from `GET /api/emission-factors`, enters quantity, date, and optional notes, and submits `TransportForm`.
2. **Client validation and API dispatch**: `TransportForm` validates required fields, positive numeric quantity within `maxQuantity`, and non future date, then calls `activityService.createActivity(payload)` via `axiosInstance`.
3. **Axios request interceptor**: Before leaving the browser, `axiosInstance` reads `vayu_token` from `localStorage` and attaches `Authorization: Bearer <token>` with `Content-Type: application/json` targeting `VITE_API_BASE_URL` (`http://localhost:8080/api`).
4. **CORS and security filter chain**: Spring Security evaluates `CorsConfig` for `http://localhost:5173`. For preflight `OPTIONS`, Spring replies with allowed methods and headers. On `POST /api/activities`, `JwtAuthenticationFilter` parses the Bearer token with `JwtService`, loads user details from `CustomUserDetailsService`, and populates `SecurityContextHolder`. Missing or invalid tokens trigger `AuthEntryPoint` returning HTTP `401` JSON.
5. **Controller binding and validation**: `ActivityController.createActivity` binds the JSON body to `ActivityRequest` and runs Bean Validation (`@Valid`). Invalid fields raise `MethodArgumentNotValidException`, formatted by `GlobalExceptionHandler` into `ApiError` (`400` with `fieldErrors`).
6. **Domain lookup and emission calculation**: `ActivityService` resolves the authenticated `User` from `SecurityContextHolder` (never from request parameters), fetches the active factor via `EmissionFactorService.getActiveFactor(activityType, unit)`, validates category, unit, and quantity bounds in `EmissionCalculator.validate`, and calculates emissions with `BigDecimal` (`quantity * factorKgCo2e`, scale 4, `RoundingMode.HALF_UP`).
7. **Database persistence in PostgreSQL**: `ActivityService` saves an `ActivityLog` entity storing a snapshot of `factorUsed` and `emissionKgCo2e` through `ActivityLogRepository.save` inside a `@Transactional` boundary. Hibernate executes the `INSERT` into `activity_logs` enforcing foreign keys (`fk_activity_logs_user`, `fk_activity_logs_emission_factor`) and `CHECK (quantity > 0)`.
8. **Response serialization and UI rendering**: `ActivityMapper.toResponse` maps the persisted row into `ActivityResponse` (excluding internal user fields and source URLs) and returns HTTP `201 Created`. `axiosInstance` delivers the JSON response to `ActivityLoggingPage`, which displays the backend returned `emissionKgCo2e` in `EmissionResultCard` and resets the form.

## Repository Folder Structure

### Root (`sustainability-platform`)

```
sustainability-platform/
  docker-compose.yml
  .env.example
  .gitignore
  README.md
  sustainability-backend/
  sustainability-frontend/
```

### Backend (`sustainability-backend/src/main`)

```
src/main/
  java/com/sustainability/
    SustainabilityApplication.java
    config/
      AppProperties.java
      CorsConfig.java
      JpaAuditingConfig.java
      SecurityConfig.java
    auth/
      controller/AuthController.java
      dto/AuthResponse.java, LoginRequest.java, RegisterRequest.java, UserSummaryDto.java
      security/AuthEntryPoint.java, CustomUserDetails.java, CustomUserDetailsService.java, JwtAuthenticationFilter.java, JwtService.java
      service/AuthService.java
    user/
      controller/UserController.java
      dto/ChangePasswordRequest.java, DeleteAccountRequest.java, UpdateUserRequest.java, UserPreferencesRequest.java, UserPreferencesResponse.java, UserProfileResponse.java
      entity/Role.java, User.java, UserPreference.java
      mapper/UserMapper.java
      repository/UserPreferenceRepository.java, UserRepository.java
      service/UserService.java
    emission/
      controller/EmissionFactorController.java
      dto/EmissionFactorResponse.java
      entity/ActivityCategory.java, EmissionFactor.java
      repository/EmissionFactorRepository.java
      service/EmissionCalculator.java, EmissionFactorService.java
    activity/
      controller/ActivityController.java, DashboardController.java
      dto/ActivityRequest.java, ActivityResponse.java, CategoryTotalDto.java, DashboardSummaryResponse.java, PatchActivityRequest.java
      entity/ActivityLog.java
      mapper/ActivityMapper.java
      repository/ActivityLogRepository.java
      service/ActivityService.java, DashboardService.java
    goal/
      entity/Goal.java, GoalStatus.java
      repository/GoalRepository.java
    badge/
      entity/Badge.java, UserBadge.java
      repository/BadgeRepository.java, UserBadgeRepository.java
    exception/
      ApiError.java, DuplicateEmailException.java, GlobalExceptionHandler.java, InvalidQuantityException.java, ResourceNotFoundException.java, UnitMismatchException.java, UnknownActivityTypeException.java
  resources/
    application.properties
    db/migration/
      V1__create_users_table.sql
      V2__create_activity_logs_table.sql
      V3__create_emission_factors_table.sql
      V4__create_goals_table.sql
      V5__create_badges_table.sql
```

### Frontend (`sustainability-frontend`)

```
sustainability-frontend/
  index.html
  package.json
  vite.config.js
  .env.development
  src/
    main.jsx
    App.jsx
    api/
      activityService.js, authService.js, axiosInstance.js, dashboardService.js, emissionFactorService.js, userService.js
    components/
      activity/CategoryTabs.jsx, ElectricityForm.jsx, EmissionResultCard.jsx, FoodForm.jsx, ShoppingForm.jsx, TransportForm.jsx
      common/Alert.jsx, Button.jsx, DataTable.jsx, InputField.jsx, Modal.jsx, SelectField.jsx, Spinner.jsx, StatCard.jsx, StatusLabel.jsx
      dashboard/CategorySummary.jsx, RecentActivities.jsx
      layout/Footer.jsx, Sidebar.jsx, Topbar.jsx
    context/AuthContext.jsx
    hooks/useActivities.js, useAuth.js
    layouts/AuthLayout.jsx, LegalLayout.jsx, MainLayout.jsx
    pages/
      ActivityLoggingPage.jsx, DashboardPage.jsx, GoalsPage.jsx, InsightsPage.jsx, LeaderboardPage.jsx, LoginPage.jsx, MyActivitiesPage.jsx, PrivacyPage.jsx, ProfilePage.jsx, RegisterPage.jsx, SettingsPage.jsx, TermsPage.jsx
    routes/AppRouter.jsx, ProtectedRoute.jsx
    styles/components.css, global.css, layout.css, variables.css
    tests/
      setup.js, mocks/handlers.js, mocks/server.js
      ActivityLoggingPage.test.jsx, DashboardPage.test.jsx, LoginPage.test.jsx, MyActivitiesPage.test.jsx, ProtectedRoute.test.jsx, RegisterPage.test.jsx, axiosInstance.test.js, validators.test.js
    utils/constants.js, formatters.js, legal.js, validators.js
```

## Architecture Notes and Known Limitations

* **Dashboard summary (Weeks 1 and 2 foundation)**: `DashboardService` runs direct JPQL aggregations over `activity_logs`. It will be replaced in Weeks 3 and 4 by the dedicated analytics engine. No Redis caching or trend calculation is included yet.
* **Emission factors verification**: Six verified emission factors are active (`ELECTRICITY_GRID` from CEA v19.0 2023, `ELECTRICITY_SOLAR` from IPCC AR5, and four transport modes from UK DESNZ 2023). Sixteen India specific transport, food, and shopping factors are seeded with `verified = false` and `active = false` until exact values are confirmed from official ARAI, CPCB, ICMR, or EPA USEEIO publications.
* **Authentication storage**: JWT tokens are stored in browser `localStorage` with a 1 hour expiry and no refresh token mechanism or OAuth2 login in Weeks 1 and 2.

## Legal Notice

All placeholder values in `sustainability-frontend/src/utils/legal.js` must be completed and reviewed by a qualified lawyer against Indian data protection law, including the Digital Personal Data Protection Act, 2023, prior to public deployment. This software does not claim legal compliance out of the box.
