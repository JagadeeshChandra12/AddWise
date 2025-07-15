-- Add name column to users table
ALTER TABLE users ADD COLUMN name TEXT;
 
-- Update existing users to have a default name (optional)
UPDATE users SET name = email WHERE name IS NULL; 