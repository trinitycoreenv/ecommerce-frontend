#!/usr/bin/env node

/**
 * Setup Verification Script
 * 
 * This script verifies that the development environment is properly configured
 * and all required dependencies are installed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

// Verification checks
const checks = {
  nodeVersion: () => {
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      if (major >= 18) {
        log(`${checkmark()} Node.js version: ${version}`, 'green');
        return true;
      } else {
        log(`${crossmark()} Node.js version ${version} is too old. Required: 18+`, 'red');
        return false;
      }
    } catch (error) {
      log(`${crossmark()} Failed to check Node.js version`, 'red');
      return false;
    }
  },

  pnpmInstalled: () => {
    try {
      const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      log(`${checkmark()} pnpm version: ${version}`, 'green');
      return true;
    } catch (error) {
      log(`${crossmark()} pnpm is not installed. Install with: npm install -g pnpm`, 'red');
      return false;
    }
  },

  postgresInstalled: () => {
    try {
      const version = execSync('psql --version', { encoding: 'utf8' }).trim();
      log(`${checkmark()} PostgreSQL: ${version}`, 'green');
      return true;
    } catch (error) {
      log(`${warning()} PostgreSQL not found in PATH. Make sure it's installed.`, 'yellow');
      return false;
    }
  },

  envFileExists: () => {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      log(`${checkmark()} .env file exists`, 'green');
      return true;
    } else {
      log(`${crossmark()} .env file not found. Copy env.example to .env`, 'red');
      return false;
    }
  },

  envVariables: () => {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missingVars = [];
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length === 0) {
      log(`${checkmark()} All required environment variables are set`, 'green');
      return true;
    } else {
      log(`${crossmark()} Missing environment variables: ${missingVars.join(', ')}`, 'red');
      return false;
    }
  },

  nodeModules: () => {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      log(`${checkmark()} node_modules directory exists`, 'green');
      return true;
    } else {
      log(`${crossmark()} node_modules not found. Run: pnpm install`, 'red');
      return false;
    }
  },

  prismaClient: () => {
    const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
      log(`${checkmark()} Prisma client generated`, 'green');
      return true;
    } else {
      log(`${crossmark()} Prisma client not generated. Run: pnpm db:generate`, 'red');
      return false;
    }
  },

  gitInstalled: () => {
    try {
      const version = execSync('git --version', { encoding: 'utf8' }).trim();
      log(`${checkmark()} Git: ${version}`, 'green');
      return true;
    } catch (error) {
      log(`${warning()} Git not found. Install from: https://git-scm.com/`, 'yellow');
      return false;
    }
  },

  packageJson: () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      log(`${checkmark()} package.json found (${pkg.name} v${pkg.version})`, 'green');
      return true;
    } else {
      log(`${crossmark()} package.json not found`, 'red');
      return false;
    }
  },

  prismaSchema: () => {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      log(`${checkmark()} Prisma schema found`, 'green');
      return true;
    } else {
      log(`${crossmark()} Prisma schema not found`, 'red');
      return false;
    }
  },
};

// Optional checks
const optionalChecks = {
  stripeKeys: () => {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasStripeSecret = envContent.includes('STRIPE_SECRET_KEY=sk_');
    const hasStripePublic = envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_');

    if (hasStripeSecret && hasStripePublic) {
      log(`${checkmark()} Stripe API keys configured`, 'green');
      return true;
    } else {
      log(`${warning()} Stripe API keys not configured (optional for development)`, 'yellow');
      return false;
    }
  },

  shippoKey: () => {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasShippoKey = envContent.includes('SHIPPO_API_KEY=shippo_');

    if (hasShippoKey) {
      log(`${checkmark()} Shippo API key configured`, 'green');
      return true;
    } else {
      log(`${warning()} Shippo API key not configured (optional for development)`, 'yellow');
      return false;
    }
  },

  sendgridKey: () => {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSendgridKey = envContent.includes('SENDGRID_API_KEY=SG.');

    if (hasSendgridKey) {
      log(`${checkmark()} SendGrid API key configured`, 'green');
      return true;
    } else {
      log(`${warning()} SendGrid API key not configured (optional for development)`, 'yellow');
      return false;
    }
  },
};

// Main verification function
async function verify() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  E-Commerce Platform - Setup Verification                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('Running required checks...\n', 'blue');

  const results = {};
  for (const [name, check] of Object.entries(checks)) {
    results[name] = check();
  }

  log('\nRunning optional checks...\n', 'blue');

  const optionalResults = {};
  for (const [name, check] of Object.entries(optionalChecks)) {
    optionalResults[name] = check();
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Verification Summary                                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const passedRequired = Object.values(results).filter(Boolean).length;
  const totalRequired = Object.keys(results).length;
  const passedOptional = Object.values(optionalResults).filter(Boolean).length;
  const totalOptional = Object.keys(optionalResults).length;

  log(`Required checks: ${passedRequired}/${totalRequired} passed`, 
    passedRequired === totalRequired ? 'green' : 'red');
  log(`Optional checks: ${passedOptional}/${totalOptional} passed\n`, 'yellow');

  if (passedRequired === totalRequired) {
    log('✅ All required checks passed! Your environment is ready.', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Run: pnpm db:migrate', 'blue');
    log('  2. Run: pnpm db:seed', 'blue');
    log('  3. Run: pnpm dev', 'blue');
    log('  4. Visit: http://localhost:3000\n', 'blue');
  } else {
    log('❌ Some required checks failed. Please fix the issues above.', 'red');
    log('\nFor help, see:', 'cyan');
    log('  - QUICK_START.md for quick setup', 'blue');
    log('  - SETUP_GUIDE.md for detailed instructions', 'blue');
    log('  - README.md for general information\n', 'blue');
  }

  if (passedOptional < totalOptional) {
    log('ℹ️  Optional integrations not configured:', 'yellow');
    if (!optionalResults.stripeKeys) {
      log('  - Stripe: Required for payment processing', 'yellow');
      log('    Get keys from: https://dashboard.stripe.com/test/apikeys', 'blue');
    }
    if (!optionalResults.shippoKey) {
      log('  - Shippo: Required for shipping rates and tracking', 'yellow');
      log('    Get key from: https://apps.goshippo.com/settings/api', 'blue');
    }
    if (!optionalResults.sendgridKey) {
      log('  - SendGrid: Optional for email notifications', 'yellow');
      log('    Get key from: https://app.sendgrid.com/settings/api_keys', 'blue');
    }
    log('');
  }

  process.exit(passedRequired === totalRequired ? 0 : 1);
}

// Run verification
verify().catch((error) => {
  log(`\n${crossmark()} Verification failed with error:`, 'red');
  console.error(error);
  process.exit(1);
});
