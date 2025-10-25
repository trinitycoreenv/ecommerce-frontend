require('dotenv').config();
const { Client } = require('pg');

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('SUCCESS: Connected to database');
    
    const result = await client.query('SELECT current_database(), version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('Version:', result.rows[0].version.split(',')[0]);
    
    const tables = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log('Tables:', tables.rows[0].count);
    
    await client.end();
    console.log('Connection test PASSED');
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

test();

