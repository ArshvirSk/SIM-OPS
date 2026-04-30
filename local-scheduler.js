#!/usr/bin/env node

/**
 * Local Autonomous Scheduler
 * 
 * Simulates Vercel Cron jobs locally for development.
 * Runs the same endpoints that would be triggered by Vercel Cron in production.
 * 
 * Usage:
 *   node local-scheduler.js
 * 
 * Or add to package.json:
 *   "scheduler": "node local-scheduler.js"
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  cronSecret: process.env.CRON_SECRET || 'dev-secret-key-change-in-production',
  
  // Schedule intervals (in milliseconds)
  schedules: {
    predictions: 6 * 60 * 60 * 1000,  // 6 hours
    anomalies: 60 * 60 * 1000,        // 1 hour
    weeklyReport: 24 * 60 * 60 * 1000 // 24 hours (check daily for Monday)
  },
  
  // For testing, use shorter intervals
  testMode: process.env.TEST_MODE === 'true',
  testIntervals: {
    predictions: 5 * 60 * 1000,   // 5 minutes
    anomalies: 2 * 60 * 1000,     // 2 minutes
    weeklyReport: 10 * 60 * 1000  // 10 minutes
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Logging utilities
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// HTTP request helper
function makeRequest(path, method = 'POST') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.cronSecret}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Local-Scheduler/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Job runners
async function runPredictions() {
  log('🔮 Running ML Predictions...', colors.cyan);
  
  try {
    const result = await makeRequest('/api/cron/predictions');
    
    if (result.status === 200) {
      const { processed, highRisk, stored } = result.data;
      logSuccess(`Predictions complete: ${processed} customers analyzed, ${highRisk} high-risk, ${stored} predictions stored`);
    } else if (result.status === 409) {
      logWarning('Predictions already running, skipping...');
    } else {
      logError(`Predictions failed: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logError(`Predictions error: ${error.message}`);
  }
}

async function runAnomalies() {
  log('🔍 Running Anomaly Detection...', colors.magenta);
  
  try {
    const result = await makeRequest('/api/cron/anomalies');
    
    if (result.status === 200) {
      const { analyzed, anomalies, alerts } = result.data;
      logSuccess(`Anomaly detection complete: ${analyzed} metrics analyzed, ${anomalies} anomalies found, ${alerts} alerts sent`);
    } else {
      logError(`Anomaly detection failed: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logError(`Anomaly detection error: ${error.message}`);
  }
}

async function runWeeklyReport() {
  const today = new Date().getDay();
  
  // Only run on Mondays (day 1)
  if (today !== 1 && !CONFIG.testMode) {
    logInfo('Weekly report: Not Monday, skipping...');
    return;
  }
  
  log('📊 Generating Weekly Report...', colors.blue);
  
  try {
    const result = await makeRequest('/api/cron/weekly-report');
    
    if (result.status === 200) {
      const { sent, channels } = result.data;
      logSuccess(`Weekly report generated and sent via: ${channels?.join(', ') || 'none'}`);
    } else {
      logError(`Weekly report failed: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logError(`Weekly report error: ${error.message}`);
  }
}

// Health check
async function checkHealth() {
  try {
    const result = await makeRequest('/api/health', 'GET');
    
    if (result.status === 200) {
      logSuccess('Server is healthy');
      return true;
    } else {
      logWarning('Server health check failed');
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

// Scheduler
class Scheduler {
  constructor() {
    this.intervals = {};
    this.isRunning = false;
    this.stats = {
      predictions: { runs: 0, lastRun: null, nextRun: null },
      anomalies: { runs: 0, lastRun: null, nextRun: null },
      weeklyReport: { runs: 0, lastRun: null, nextRun: null }
    };
  }

  async start() {
    if (this.isRunning) {
      logWarning('Scheduler already running');
      return;
    }

    log('🚀 Starting Local Autonomous Scheduler...', colors.bright);
    logInfo(`Base URL: ${CONFIG.baseUrl}`);
    logInfo(`Test Mode: ${CONFIG.testMode ? 'ENABLED (shorter intervals)' : 'DISABLED (production intervals)'}`);
    
    // Check server health
    const healthy = await checkHealth();
    if (!healthy) {
      logError('Server is not responding. Make sure Next.js dev server is running on port 3000');
      logInfo('Start the server with: npm run dev');
      process.exit(1);
    }

    this.isRunning = true;

    // Get intervals based on mode
    const intervals = CONFIG.testMode ? CONFIG.testIntervals : CONFIG.schedules;

    // Schedule predictions
    this.scheduleJob('predictions', runPredictions, intervals.predictions);
    
    // Schedule anomaly detection
    this.scheduleJob('anomalies', runAnomalies, intervals.anomalies);
    
    // Schedule weekly report
    this.scheduleJob('weeklyReport', runWeeklyReport, intervals.weeklyReport);

    // Run initial jobs after 5 seconds
    setTimeout(() => {
      logInfo('Running initial jobs...');
      runPredictions();
      setTimeout(() => runAnomalies(), 2000);
    }, 5000);

    // Display status every 30 seconds
    setInterval(() => this.displayStatus(), 30000);
    
    logSuccess('Scheduler started successfully!');
    this.displayStatus();
  }

  scheduleJob(name, jobFn, interval) {
    const intervalMinutes = Math.round(interval / 60000);
    logInfo(`Scheduled ${name}: every ${intervalMinutes} minutes`);
    
    this.stats[name].nextRun = new Date(Date.now() + interval);
    
    this.intervals[name] = setInterval(async () => {
      this.stats[name].runs++;
      this.stats[name].lastRun = new Date();
      this.stats[name].nextRun = new Date(Date.now() + interval);
      
      await jobFn();
    }, interval);
  }

  displayStatus() {
    console.log('\n' + '='.repeat(80));
    log('📊 Scheduler Status', colors.bright);
    console.log('='.repeat(80));
    
    Object.entries(this.stats).forEach(([name, stats]) => {
      const lastRun = stats.lastRun ? stats.lastRun.toLocaleTimeString() : 'Never';
      const nextRun = stats.nextRun ? stats.nextRun.toLocaleTimeString() : 'N/A';
      
      console.log(`\n${colors.cyan}${name}${colors.reset}:`);
      console.log(`  Runs: ${stats.runs}`);
      console.log(`  Last: ${lastRun}`);
      console.log(`  Next: ${nextRun}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    log('Stopping scheduler...', colors.yellow);
    
    Object.values(this.intervals).forEach(interval => {
      clearInterval(interval);
    });
    
    this.isRunning = false;
    logSuccess('Scheduler stopped');
  }
}

// Main
async function main() {
  // Display banner
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.cyan + '  🤖 SIM-OPS Local Autonomous Scheduler' + colors.reset);
  console.log('='.repeat(80) + '\n');

  // Check environment
  if (!process.env.CRON_SECRET && !CONFIG.cronSecret) {
    logWarning('CRON_SECRET not set, using default dev key');
    logInfo('Set CRON_SECRET in .env.local for production');
  }

  // Create and start scheduler
  const scheduler = new Scheduler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n');
    log('Received SIGINT, shutting down gracefully...', colors.yellow);
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n');
    log('Received SIGTERM, shutting down gracefully...', colors.yellow);
    scheduler.stop();
    process.exit(0);
  });

  // Start the scheduler
  await scheduler.start();
}

// Run
if (require.main === module) {
  main().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { Scheduler, runPredictions, runAnomalies, runWeeklyReport };
