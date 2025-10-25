#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests PostgreSQL database connectivity and basic operations
 */

require('dotenv').config();
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('📋 Connection Details:');
  // Parse and display connection info (without password)
  try {
    const url = new URL(connectionString);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   Database: ${url.pathname.slice(1).split('?')[0]}`);
    console.log(`   User: ${url.username}`);
    console.log(`   Password: ${'*'.repeat(url.password.length)}\n`);
  } catch (error) {
    console.error('❌ ERROR: Invalid DATABASE_URL format');
    console.error(error.message);
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    // Test 1: Connect to database
    console.log('🔌 Test 1: Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to database\n');

    // Test 2: Check database version
    console.log('🔍 Test 2: Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ PostgreSQL Version:', versionResult.rows[0].version.split(',')[0], '\n');

    // Test 3: Check if database exists
    console.log('🔍 Test 3: Checking database...');
    const dbResult = await client.query('SELECT current_database()');
    console.log('✅ Current Database:', dbResult.rows[0].current_database, '\n');

    // Test 4: Check if Prisma tables exist
    console.log('🔍 Test 4: Checking for Prisma tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  WARNING: No tables found in database');
      console.log('   Run "pnpm db:push" or "pnpm db:migrate" to create tables\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 5: Check for _prisma_migrations table
    console.log('🔍 Test 5: Checking migration status...');
    const migrationCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
      )
    `);

    if (migrationCheck.rows[0].exists) {
      const migrationCount = await client.query('SELECT COUNT(*) FROM _prisma_migrations');
      console.log(`✅ Migrations table exists with ${migrationCount.rows[0].count} migrations\n`);
    } else {
      console.log('⚠️  WARNING: No migrations table found\n');
    }

    // Test 6: Test basic query performance
    console.log('🔍 Test 6: Testing query performance...');
    const startTime = Date.now();
    await client.query('SELECT 1');
    const endTime = Date.now();
    console.log(`✅ Query executed in ${endTime - startTime}ms\n`);

    console.log('✅ All database connection tests passed!\n');
    console.log('📊 Summary:');
    console.log('   ✓ Database connection successful');
    console.log('   ✓ PostgreSQL is running');
    console.log('   ✓ Database is accessible');
    console.log(`   ✓ ${tablesResult.rows.length} tables found`);
    console.log('');

  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION ERROR:\n');

    if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. Possible causes:');
      console.error('   - PostgreSQL server is not running');
      console.error('   - Wrong host or port');
      console.error('   - Firewall blocking the connection\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   Host not found. Possible causes:');
      console.error('   - Wrong hostname/IP address');
      console.error('   - DNS resolution failed\n');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed. Possible causes:');
      console.error('   - Wrong username or password');
      console.error('   - User does not have access to the database\n');
    } else if (error.code === '3D000') {
      console.error('   Database does not exist. Possible causes:');
      console.error('   - Database has not been created yet');
      console.error('   - Wrong database name in connection string\n');
    } else {
      console.error('   Error details:');
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}\n`);
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testDatabaseConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
