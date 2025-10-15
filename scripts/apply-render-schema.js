const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.resolve(process.cwd(), 'render_schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`Schema file not found at ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const connectionString = process.env.DATABASE_URL_RENDER;
  if (!connectionString) {
    console.error('DATABASE_URL_RENDER is not set in env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔐 Connecting to Render Postgres with SSL...');
    await client.connect();
    console.log('✅ Connected. Applying schema from render_schema.sql...');

    // Split statements cautiously on semicolons that end lines
    const statements = sql
      .split(/;\s*\n/g)
      .map((s) => s.trim())
      .filter(Boolean);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
      } catch (err) {
        console.error(`❌ Error applying statement ${i + 1}/${statements.length}:`, err.message);
        console.error('Statement:\n' + stmt);
        throw err;
      }
    }

    console.log('🎉 Schema applied successfully to Render database.');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();