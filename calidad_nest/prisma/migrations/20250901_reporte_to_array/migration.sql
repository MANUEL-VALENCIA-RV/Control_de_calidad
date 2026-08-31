-- Convert reporte from String to String[]
-- Preserva datos existentes convirtiendo "texto" -> ["texto"]
ALTER TABLE "reportes" ALTER COLUMN "reporte" TYPE TEXT[] USING
  CASE
    WHEN "reporte" IS NULL OR "reporte" = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["reporte"]::TEXT[]
  END;
