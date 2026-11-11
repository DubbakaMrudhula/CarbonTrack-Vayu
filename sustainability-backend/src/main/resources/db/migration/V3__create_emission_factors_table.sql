-- V3__create_emission_factors_table.sql
-- Create emission_factors table, link activity_logs via foreign key, and seed factors

CREATE TABLE emission_factors (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    factor_kg_co2e NUMERIC(14,6) NOT NULL,
    max_quantity NUMERIC(12,4) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_year VARCHAR(50) NOT NULL,
    source_url TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emission_factors_type_unit UNIQUE (activity_type, unit)
);

-- Add foreign key constraint to activity_logs table
ALTER TABLE activity_logs
    ADD CONSTRAINT fk_activity_logs_emission_factor
    FOREIGN KEY (emission_factor_id)
    REFERENCES emission_factors(id)
    ON DELETE RESTRICT;

-- Seed verified emission factors
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES
    ('ELECTRICITY', 'ELECTRICITY_GRID', 'Grid Electricity (India Average)', 'kWh', 0.716000, 10000.0000, 'Central Electricity Authority (CEA) CO2 Baseline Database for the Indian Power Sector, Version 19.0', '2023', 'https://cea.nic.in/cdm-co2-baseline-database/', true, true),
    ('ELECTRICITY', 'ELECTRICITY_SOLAR', 'Solar Electricity (Rooftop / Off-grid)', 'kWh', 0.000000, 10000.0000, 'IPCC 5th Assessment Report WGIII Annex III Technology-specific Parameters (Direct Operational Emissions)', '2014', 'https://www.ipcc.ch/report/ar5/wg3/', true, true),
    ('TRANSPORTATION', 'CAR_PETROL', 'Petrol Car (Medium)', 'km', 0.170480, 5000.0000, 'UK DESNZ GHG Conversion Factors for Company Reporting (Passenger vehicles, medium petrol)', '2023', 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023', true, true),
    ('TRANSPORTATION', 'CAR_DIESEL', 'Diesel Car (Medium)', 'km', 0.171120, 5000.0000, 'UK DESNZ GHG Conversion Factors for Company Reporting (Passenger vehicles, medium diesel)', '2023', 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023', true, true),
    ('TRANSPORTATION', 'FLIGHT_SHORT_HAUL', 'Short-haul Flight (Domestic)', 'km', 0.155730, 20000.0000, 'UK DESNZ GHG Conversion Factors for Company Reporting (Business travel - air, domestic)', '2023', 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023', true, true),
    ('TRANSPORTATION', 'FLIGHT_LONG_HAUL', 'Long-haul Flight (International)', 'km', 0.147870, 30000.0000, 'UK DESNZ GHG Conversion Factors for Company Reporting (Business travel - air, long-haul economy)', '2023', 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023', true, true);

-- Seed unverified/TODO emission factors (factor 0, verified=false, active=false)

-- TODO: fill from ARAI Passenger Car Emission Factors / MoEFCC GHG Inventory Table 3.2
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'CAR_CNG', 'CNG Car', 'km', 0.000000, 5000.0000, 'TODO: Automotive Research Association of India (ARAI)', 'Pending', 'https://www.araiindia.com', false, false);

-- TODO: fill from ARAI Indian Driving Cycle Emission Factors for Two-Wheelers / CPCB
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'TWO_WHEELER_PETROL', 'Two-wheeler (Petrol)', 'km', 0.000000, 3000.0000, 'TODO: ARAI / Central Pollution Control Board (CPCB)', 'Pending', 'https://cpcb.nic.in', false, false);

-- TODO: fill from ARAI Emission Factor Database for Three-Wheelers / CPCB
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'AUTO_RICKSHAW_CNG', 'Auto-rickshaw (CNG)', 'km', 0.000000, 2000.0000, 'TODO: ARAI / CPCB Three-Wheeler CNG Database', 'Pending', 'https://cpcb.nic.in', false, false);

-- TODO: fill from CPCB / ARAI Urban Bus Transport Emission Factors per passenger-km
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'BUS_CITY', 'City Bus', 'passenger-km', 0.000000, 3000.0000, 'TODO: CPCB / Urban Transport Emission Report', 'Pending', 'https://cpcb.nic.in', false, false);

-- TODO: fill from Indian Railways / CEA Specific Electric Traction CO2 Factor per passenger-km
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'LOCAL_TRAIN', 'Local Train', 'passenger-km', 0.000000, 5000.0000, 'TODO: Indian Railways Sustainability Directorate / CEA', 'Pending', 'https://indianrailways.gov.in', false, false);

-- TODO: fill from DMRC Annual Sustainability Report, Specific Carbon Emission per passenger-km
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('TRANSPORTATION', 'METRO', 'Metro', 'passenger-km', 0.000000, 5000.0000, 'TODO: Delhi Metro Rail Corporation (DMRC) Sustainability Report', 'Pending', 'https://www.delhimetrorail.com', false, false);

-- TODO: fill from peer-reviewed LCA (Poore & Nemecek 2018 Science, plant-based diet average per serving)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_VEGAN', 'Vegan Meal', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed LCA (Poore & Nemecek, not IPCC/EPA)', 'Pending', 'https://doi.org/10.1126/science.aaq0216', false, false);

-- TODO: fill from peer-reviewed LCA (Poore & Nemecek 2018 Science, lacto-vegetarian diet average per serving)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_VEGETARIAN', 'Vegetarian Meal', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed LCA (Poore & Nemecek, not IPCC/EPA)', 'Pending', 'https://doi.org/10.1126/science.aaq0216', false, false);

-- TODO: fill from peer-reviewed Indian dietary lifecycle study (ICMR / Lancet-EAT India adaptation)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_VEG_THALI', 'Vegetarian Thali', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed Indian dietary lifecycle study (not IPCC/EPA)', 'Pending', 'https://icmr.nic.in', false, false);

-- TODO: fill from peer-reviewed Indian dietary lifecycle study (ICMR / Lancet-EAT India non-veg adaptation)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_NON_VEG_THALI', 'Non-vegetarian Thali', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed Indian dietary lifecycle study (not IPCC/EPA)', 'Pending', 'https://icmr.nic.in', false, false);

-- TODO: fill from peer-reviewed LCA poultry meal average (Poore & Nemecek 2018 / CEDA LCA)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_NON_VEG_CHICKEN', 'Chicken Meal', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed LCA (Poore & Nemecek, not IPCC/EPA)', 'Pending', 'https://doi.org/10.1126/science.aaq0216', false, false);

-- TODO: fill from peer-reviewed LCA beef cattle average per serving (Poore & Nemecek 2018)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('FOOD', 'MEAL_BEEF', 'Beef Meal', 'serving', 0.000000, 20.0000, 'TODO: Peer-reviewed LCA (Poore & Nemecek, not IPCC/EPA)', 'Pending', 'https://doi.org/10.1126/science.aaq0216', false, false);

-- TODO: fill from EPA USEEIO spend-based model adapted for Indian apparel consumption (INR)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('SHOPPING', 'SHOPPING_CLOTHING', 'Clothing & Footwear (INR)', 'INR', 0.000000, 1000000.0000, 'TODO: EPA USEEIO spend-based model adapted for INR', 'Pending', 'https://www.epa.gov', false, false);

-- TODO: fill from EPA USEEIO v2.0 Supply Chain GHG Emission Factors (Apparel and accessories commodities in USD)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('SHOPPING', 'SHOPPING_CLOTHING', 'Clothing & Footwear (USD)', 'USD', 0.000000, 50000.0000, 'TODO: EPA USEEIO v2.0 Supply Chain GHG Emission Factors', 'Pending', 'https://www.epa.gov', false, false);

-- TODO: fill from EPA USEEIO spend-based model adapted for Indian electronic hardware consumption (INR)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('SHOPPING', 'SHOPPING_ELECTRONICS', 'Electronics & Appliances (INR)', 'INR', 0.000000, 1000000.0000, 'TODO: EPA USEEIO spend-based model adapted for INR', 'Pending', 'https://www.epa.gov', false, false);

-- TODO: fill from EPA USEEIO v2.0 Supply Chain GHG Emission Factors (Electronic hardware commodities in USD)
INSERT INTO emission_factors (category, activity_type, display_name, unit, factor_kg_co2e, max_quantity, source_name, source_year, source_url, verified, active)
VALUES ('SHOPPING', 'SHOPPING_ELECTRONICS', 'Electronics & Appliances (USD)', 'USD', 0.000000, 50000.0000, 'TODO: EPA USEEIO v2.0 Supply Chain GHG Emission Factors', 'Pending', 'https://www.epa.gov', false, false);

