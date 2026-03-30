-- ============================================================
-- Migration: Fix commandes table for refund management feature
-- Date: 2026-03-29
--
-- Issues fixed:
--   1. Missing column: refund_supplier_message
--   2. Stale ENUM: refund_request_status missing 4 new values
--      (ddl-auto=update can add columns but cannot alter MySQL ENUMs)
--
-- Row-size note:
--   The table is near the 65535-byte InnoDB row limit due to
--   multiple VARCHAR(2000) columns. We convert the large text
--   columns to TEXT to stay safely under the limit.
-- ============================================================

-- Step 1: Convert existing VARCHAR(2000) columns to TEXT to free row space
--         (TEXT/BLOB stored off-page, only 12-byte pointer in row)
ALTER TABLE commandes
    MODIFY COLUMN refund_description TEXT DEFAULT NULL,
    MODIFY COLUMN refund_affected_items TEXT DEFAULT NULL,
    MODIFY COLUMN dispute_reason TEXT DEFAULT NULL,
    MODIFY COLUMN supplier_response_message TEXT DEFAULT NULL,
    MODIFY COLUMN admin_decision_reason TEXT DEFAULT NULL;

-- Step 2: Add the missing column
ALTER TABLE commandes
    ADD COLUMN IF NOT EXISTS refund_supplier_message TEXT DEFAULT NULL;

-- Step 3: Update refund_request_status ENUM to include new values
ALTER TABLE commandes
    MODIFY COLUMN refund_request_status
    ENUM('NONE','OPEN','SUPPLIER_ACCEPTED','SUPPLIER_REJECTED','PARTIAL_OFFERED','ESCALATED_TO_DISPUTE','RESOLVED','REJECTED')
    DEFAULT NULL;
