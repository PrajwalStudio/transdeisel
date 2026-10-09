CREATE TABLE equipment (
    equipment_no        VARCHAR(50) PRIMARY KEY,
    manufacturing_date  DATE,
    warranty_status     VARCHAR(20) DEFAULT 'Out of Warranty',
    warranty_start_date DATE,
    warranty_end_date   DATE,

    -- AMC Details
    in_amc              BOOLEAN DEFAULT FALSE,
    amc_start_date      DATE,
    amc_end_date        DATE,
    amc_location        VARCHAR(50),
    amc_amount          NUMERIC(12, 2),
    po_number           VARCHAR(100),
    po_date             DATE,

    -- Engine Details
    engine_dgno         VARCHAR(50),
    engine_make         VARCHAR(50),
    engine_model        VARCHAR(50),
    kva_hp              VARCHAR(50),

    -- Alternator Details
    alternator_make     VARCHAR(50),
    alternator_sno      VARCHAR(50),
    alternator_model    VARCHAR(50),

    -- Customer / Site Details
    customer_name       VARCHAR(100),
    site_name           VARCHAR(100),
    address             TEXT,
    contact_person      VARCHAR(100),
    contact_number      VARCHAR(15),
    email               VARCHAR(100)
);

-- Table 2: Service Requests
CREATE TYPE call_category_enum AS ENUM (
    'Preventive Maintainance-B',
    'Preventive Maintainance-C',
    'Preventive Maintainance-D',
    'Preventive Maintainance-E',
    'Complaint',
    'AMC Visit'
);

CREATE TABLE service_request (
    request_id      SERIAL PRIMARY KEY,
    equipment_no    VARCHAR(50) REFERENCES equipment(equipment_no) ON DELETE CASCADE,

    call_category   call_category_enum NOT NULL,
    pm_service_period VARCHAR(20),

    visit_date      DATE,
    running_hours   INT,

    symptom         TEXT,
    cause           TEXT,
    activity        TEXT,
    comments        TEXT
);

-- Table 3: Service Orders (auto-created from requests)
CREATE TABLE service_orders (
    order_id            SERIAL PRIMARY KEY,
    request_id          INT REFERENCES service_request(request_id) ON DELETE CASCADE,

    order_date          DATE DEFAULT CURRENT_DATE,
    approval_status     VARCHAR(20) DEFAULT 'Pending',
    completion_status   VARCHAR(20) DEFAULT 'Pending'
);
-- Table 4: Invoices
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES service_request(request_id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
