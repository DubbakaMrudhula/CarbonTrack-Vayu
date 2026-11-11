-- V2__create_activity_logs_table.sql
-- Create activity_logs table with emission_factor_id without foreign key constraint

CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    emission_factor_id BIGINT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    factor_used NUMERIC(14,6) NOT NULL,
    emission_kg_co2e NUMERIC(14,4) NOT NULL,
    log_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_logs_user_date ON activity_logs (user_id, log_date);
CREATE INDEX idx_activity_logs_user_category ON activity_logs (user_id, category);

