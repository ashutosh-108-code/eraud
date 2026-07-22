-- Fraud Shield — Supabase Schema
-- Run this once in the Supabase SQL Editor after creating your project.

CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id    TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  label           TEXT NOT NULL,
  confidence      REAL NOT NULL,
  state           TEXT,
  phones          JSONB DEFAULT '[]',
  graph_updated   BOOLEAN DEFAULT FALSE,
  heatmap_updated BOOLEAN DEFAULT FALSE,
  alert_generated BOOLEAN DEFAULT FALSE,
  training_saved  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS training_data (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  example_id TEXT NOT NULL,
  text       TEXT NOT NULL,
  label      TEXT NOT NULL,
  confidence REAL NOT NULL,
  source     TEXT DEFAULT 'citizen_complaint',
  verified   BOOLEAN DEFAULT FALSE,
  timestamp  TIMESTAMPTZ NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_state_key ON app_state (key);
CREATE INDEX IF NOT EXISTS idx_complaints_timestamp ON complaints_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_timestamp ON training_data (timestamp DESC);
