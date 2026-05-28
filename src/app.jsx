-- ============================================================================
-- Documents module — schema for per-employee + company-wide documents
--
-- ⚠️ BEFORE RUNNING THIS SQL: create two Storage buckets in Supabase Dashboard:
--    1. employee-documents  (private)
--    2. company-documents   (private)
-- Both must be private buckets; the app generates signed URLs for downloads.
--
-- See "Storage" in the Supabase sidebar → New Bucket → mark Private.
-- ============================================================================

-- ── Table: employee_documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,                -- original filename uploaded
  storage_path  TEXT NOT NULL UNIQUE,         -- path within the bucket: employees/{employee_id}/{uuid}-{filename}
  mime_type     TEXT,
  file_size     INTEGER,                      -- bytes
  uploaded_by   UUID REFERENCES employees(id) ON DELETE SET NULL,
  uploader_name TEXT,                         -- snapshot
  notes         TEXT,                         -- optional context
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emp_docs_employee_idx ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS emp_docs_uploaded_idx ON employee_documents(uploaded_at DESC);

-- ── Table: company_documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL UNIQUE,         -- path: company/{uuid}-{filename}
  mime_type     TEXT,
  file_size     INTEGER,
  title         TEXT,                         -- human-friendly title (optional, falls back to file_name)
  description   TEXT,
  uploaded_by   UUID REFERENCES employees(id) ON DELETE SET NULL,
  uploader_name TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS company_docs_uploaded_idx ON company_documents(uploaded_at DESC);

-- ── RLS: permissive at DB layer; app enforces who can see/upload ─────────────
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emp_docs_all"     ON employee_documents;
DROP POLICY IF EXISTS "company_docs_all" ON company_documents;
CREATE POLICY "emp_docs_all"     ON employee_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "company_docs_all" ON company_documents  FOR ALL USING (true) WITH CHECK (true);

-- ── Storage bucket policies — run AFTER creating the two buckets ──────────────
-- These allow anon-key uploads/downloads. App-level checks enforce who can do what.

-- Allow uploads to employee-documents bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents',  'company-documents',  false)
  ON CONFLICT (id) DO NOTHING;

-- Drop and recreate storage policies idempotently
DROP POLICY IF EXISTS "emp_docs_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "emp_docs_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "emp_docs_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "company_docs_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "company_docs_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "company_docs_storage_delete" ON storage.objects;

CREATE POLICY "emp_docs_storage_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'employee-documents');
CREATE POLICY "emp_docs_storage_insert" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'employee-documents');
CREATE POLICY "emp_docs_storage_delete" ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'employee-documents');

CREATE POLICY "company_docs_storage_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'company-documents');
CREATE POLICY "company_docs_storage_insert" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'company-documents');
CREATE POLICY "company_docs_storage_delete" ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'company-documents');

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT 'employee_documents' AS table_name, COUNT(*) AS rows FROM employee_documents
UNION ALL SELECT 'company_documents', COUNT(*) FROM company_documents
UNION ALL SELECT 'buckets', COUNT(*) FROM storage.buckets WHERE id IN ('employee-documents', 'company-documents');
