-- Create users table for wallet authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups on wallet_address
CREATE INDEX IF NOT EXISTS idx_wallet_address ON public.users(wallet_address);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this based on your needs)
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create policy for public read access
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT
  USING (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
