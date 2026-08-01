// scripts/commit-with-message.js
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read the new version
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

rl.question('Enter commit message: ', (message) => {
  if (!message.trim()) {
    console.error('❌ Commit message cannot be empty');
    rl.close();
    process.exit(1);
  }
  
  const fullMessage = `${message} (v${version})`;
  execSync(`git commit -m "${fullMessage}"`, { stdio: 'inherit' });
  console.log(`✅ Committed: "${fullMessage}"`);
  rl.close();
});

