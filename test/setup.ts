import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

jest.setTimeout(30000); // 30 second timeout for tests

process.env.SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'test_key';
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';