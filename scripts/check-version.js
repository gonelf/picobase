#!/usr/bin/env node

/**
 * Checks if the @picobase_app/client package version has changed
 * and needs to be published to npm
 */

const { execSync } = require('child_process');
const packageJson = require('../packages/client/package.json');

const localVersion = packageJson.version;

try {
  const publishedVersion = execSync(
    'npm view @picobase_app/client version',
    { encoding: 'utf8' }
  ).trim();

  console.log(`📦 Local version:     ${localVersion}`);
  console.log(`🌐 Published version: ${publishedVersion}`);

  if (localVersion === publishedVersion) {
    console.log('\n✅ Versions match - no publish needed');
    process.exit(0);
  } else {
    console.log('\n🚀 Version changed - ready to publish!');
    console.log(`\nRun: npm run client:release:minor`);
    process.exit(1); // Exit with error to block CI if not published
  }
} catch (error) {
  if (error.message.includes('E404')) {
    console.log(`📦 Local version:     ${localVersion}`);
    console.log(`🌐 Published version: (not published yet)`);
    console.log('\n🚀 Package not found on npm - ready for first publish!');
    console.log(`\nRun: cd packages/client && npm publish`);
    process.exit(1);
  }
  console.error('❌ Error checking npm version:', error.message);
  process.exit(1);
}
