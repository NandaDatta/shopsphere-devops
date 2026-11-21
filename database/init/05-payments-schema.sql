\connect shopsphere_payments

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN (
            'card',
            'upi',
            'netbanking',
            'wallet'
        )),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'successful',
            'failed',
            'refunded'
        )),
    transaction_reference VARCHAR(100) UNIQUE,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
    ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);