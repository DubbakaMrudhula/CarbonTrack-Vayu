-- V5__create_badges_table.sql
-- Create badges and user_badges tables, then seed initial badges

CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_badges UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges (user_id);

INSERT INTO badges (code, name, description)
VALUES
    ('STREAK_7_DAYS', '7-Day Streak', 'Logged at least one activity for 7 consecutive days'),
    ('FIRST_GOAL_ACHIEVED', 'First Goal Achieved', 'Successfully achieved your first carbon reduction goal'),
    ('REDUCTION_10_KG', '10 kg CO2e Reduced', 'Reduced carbon footprint by 10 kg CO2e against target'),
    ('REDUCTION_25_KG', '25 kg CO2e Reduced', 'Reduced carbon footprint by 25 kg CO2e against target'),
    ('REDUCTION_50_KG', '50 kg CO2e Reduced', 'Reduced carbon footprint by 50 kg CO2e against target');

