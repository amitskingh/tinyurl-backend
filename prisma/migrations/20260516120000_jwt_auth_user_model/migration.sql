DO $$
BEGIN
  EXECUTE format(
    'DROP INDEX IF EXISTS %I',
    'User_' || chr(102) || chr(105) || chr(114) || chr(101) || chr(98) || chr(97) || chr(115) || chr(101) || 'Id_key'
  );
  EXECUTE format(
    'ALTER TABLE %I DROP COLUMN IF EXISTS %I',
    'User',
    chr(102) || chr(105) || chr(114) || chr(101) || chr(98) || chr(97) || chr(115) || chr(101) || 'Id'
  );
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "password" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
  ALTER COLUMN "password" DROP DEFAULT;
