#!/usr/bin/env node

/**
 * Comprehensive Connection Test Script
 * Tests Frontend → Backend → Database connectivity
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { Client } = require('pg');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testDatabaseConnection() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('🗄️  TEST 1: DATABASE CONNECTION', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    log('❌ DATABASE_URL not configured', colors.red);
    return false;
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    const result = await client.query('SELECT current_database(), version()');
    log('✅ Database connection successful', colors.green);
    log(`   Database: ${result.rows[0].current_database}`, colors.green);
    log(`   Version: ${result.rows[0].version.split(',')[0]}`, colors.green);
    
    // Check table count
    const tables = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    log(`   Tables: ${tables.rows[0].count}`, colors.green);
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, colors.red);
    if (error.code === 'ECONNREFUSED') {
      log('   → PostgreSQL server is not running or not accessible', colors.yellow);
    } else if (error.code === '28P01' || error.code === '28000') {
      log('   → Authentication failed - check username/password', colors.yellow);
    }
    return false;
  }
}

async function testBackendAPI() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('🔧 TEST 2: BACKEND API ENDPOINTS', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoints = [
    { path: '/api/categories', name: 'Categories API', requiresAuth: false },
    { path: '/api/public/products', name: 'Public Products API', requiresAuth: false },
    { path: '/api/subscription-plans', name: 'Subscription Plans API', requiresAuth: false },
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint.path}`;
      log(`Testing: ${endpoint.name}`, colors.blue);
      log(`   URL: ${url}`, colors.blue);
      
      const response = await makeRequest(url);
      
      if (response.statusCode === 200) {
        log(`   ✅ Status: ${response.statusCode} OK`, colors.green);
        if (response.json && response.json.success) {
          log(`   ✅ Response: Valid JSON with success=true`, colors.green);
          successCount++;
        } else if (response.json) {
          log(`   ⚠️  Response: JSON received but success=${response.json.success}`, colors.yellow);
        } else {
          log(`   ⚠️  Response: Not valid JSON`, colors.yellow);
        }
      } else {
        log(`   ❌ Status: ${response.statusCode}`, colors.red);
        if (response.json && response.json.error) {
          log(`   Error: ${response.json.error}`, colors.red);
        }
      }
    } catch (error) {
      log(`   ❌ Request failed: ${error.message}`, colors.red);
      if (error.code === 'ECONNREFUSED') {
        log('   → Backend server is not running', colors.yellow);
        log('   → Run "pnpm dev" to start the server', colors.yellow);
      }
    }
    console.log('');
  }

  return successCount === endpoints.length;
}

async function testCORS() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('🌐 TEST 3: CORS CONFIGURATION', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await makeRequest(`${baseUrl}/api/categories`);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
    };

    log('CORS Headers:', colors.blue);
    if (corsHeaders['access-control-allow-origin']) {
      log(`   ✅ Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`, colors.green);
    } else {
      log('   ⚠️  Access-Control-Allow-Origin: Not set', colors.yellow);
    }

    if (corsHeaders['access-control-allow-methods']) {
      log(`   ✅ Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods']}`, colors.green);
    } else {
      log('   ⚠️  Access-Control-Allow-Methods: Not set', colors.yellow);
    }

    if (corsHeaders['access-control-allow-headers']) {
      log(`   ✅ Access-Control-Allow-Headers: ${corsHeaders['access-control-allow-headers']}`, colors.green);
    } else {
      log('   ⚠️  Access-Control-Allow-Headers: Not set', colors.yellow);
    }

    return true;
  } catch (error) {
    log(`❌ CORS test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('⚙️  TEST 4: ENVIRONMENT VARIABLES', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  const optionalVars = [
    'NEXT_PUBLIC_API_URL',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'SHIPPO_API_KEY',
  ];

  let allRequired = true;

  log('Required Variables:', colors.blue);
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      const value = varName.includes('SECRET') || varName.includes('PASSWORD') 
        ? '***' + process.env[varName].slice(-4)
        : process.env[varName];
      log(`   ✅ ${varName}: ${value}`, colors.green);
    } else {
      log(`   ❌ ${varName}: Not set`, colors.red);
      allRequired = false;
    }
  }

  log('\nOptional Variables:', colors.blue);
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      const value = varName.includes('SECRET') || varName.includes('KEY')
        ? '***' + process.env[varName].slice(-4)
        : process.env[varName];
      log(`   ✅ ${varName}: ${value}`, colors.green);
    } else {
      log(`   ⚠️  ${varName}: Not set (optional)`, colors.yellow);
    }
  }

  return allRequired;
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║     ECOMMERCE APPLICATION - CONNECTION TEST SUITE              ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════════╝', colors.cyan);

  const results = {
    database: await testDatabaseConnection(),
    backend: await testBackendAPI(),
    cors: await testCORS(),
    env: await testEnvironmentVariables(),
  };

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('📊 TEST SUMMARY', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  const tests = [
    { name: 'Database Connection', result: results.database },
    { name: 'Backend API', result: results.backend },
    { name: 'CORS Configuration', result: results.cors },
    { name: 'Environment Variables', result: results.env },
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    const color = test.result ? colors.green : colors.red;
    log(`${status} - ${test.name}`, color);
  });

  const allPassed = Object.values(results).every(r => r);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  if (allPassed) {
    log('✅ ALL TESTS PASSED - Application is ready!', colors.green);
  } else {
    log('⚠️  SOME TESTS FAILED - Please review the errors above', colors.yellow);
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  process.exit(allPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

