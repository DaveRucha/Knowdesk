-- Enable Row Level Security on tenant content tables
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chunk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Query" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SOP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;

-- Rows are visible/writable only when organizationId matches the
-- per-transaction setting app.current_org_id.
-- current_setting(..., true) returns NULL if unset -> no rows -> fails closed.

CREATE POLICY tenant_isolation ON "Document"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY tenant_isolation ON "Chunk"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY tenant_isolation ON "Query"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY tenant_isolation ON "SOP"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY tenant_isolation ON "Job"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));