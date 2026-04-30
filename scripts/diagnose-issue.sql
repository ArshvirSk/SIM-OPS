-- Diagnostic Script
-- Run this to see what's happening

-- Check if predictions table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'predictions')
    THEN 'predictions table EXISTS'
    ELSE 'predictions table DOES NOT EXIST'
  END as table_status;

-- If table exists, show its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'predictions'
ORDER BY ordinal_position;

-- Check for any existing policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'predictions';

-- Check for any existing functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%prediction%';
