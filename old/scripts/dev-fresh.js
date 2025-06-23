#!/usr/bin/env node

/**
 * Development script to ensure fresh builds without cache issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning development cache...');

// Clear Vite cache
try {
  execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
  console.log('✅ Cleared Vite cache');
} catch (error) {
  console.log('ℹ️  No Vite cache to clear');
}

// Clear dist folder
try {
  execSync('rm -rf dist', { stdio: 'inherit' });
  console.log('✅ Cleared dist folder');
} catch (error) {
  console.log('ℹ️  No dist folder to clear');
}

// Add timestamp to force browser refresh
const timestamp = Date.now();
const indexPath = path.join(__dirname, '../index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remove existing timestamp if present
  content = content.replace(/<!-- CACHE_BUST: \d+ -->/, '');
  
  // Add new timestamp
  content = content.replace(
    '<head>',
    `<head>\n  <!-- CACHE_BUST: ${timestamp} -->`
  );
  
  fs.writeFileSync(indexPath, content);
  console.log(`✅ Added cache bust timestamp: ${timestamp}`);
}

console.log('🚀 Starting fresh development server...');

// Start dev server
execSync('npm run dev', { stdio: 'inherit' });
