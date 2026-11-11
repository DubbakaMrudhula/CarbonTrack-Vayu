-- V1__create_users_table.sql
-- Create users table and user_preferences table (1:1 with users)

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    region VARCHAR(100) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    diet_type VARCHAR(50) NOT NULL DEFAULT 'VEGETARIAN',
    primary_transport VARCHAR(50) NOT NULL DEFAULT 'METRO',
    household_size INT NOT NULL DEFAULT 1,
    focus_categories VARCHAR(255) NOT NULL DEFAULT 'TRANSPORTATION,ELECTRICITY',
    weekly_target_kg NUMERIC(10,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

