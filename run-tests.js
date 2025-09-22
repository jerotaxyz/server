#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Jerota Backend Tests\n');

// Install dependencies if needed
console.log('📦 Installing dependencies...');
const install = spawn('npm', ['install'], { stdio: 'inherit' });

install.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Failed to install dependencies');
        process.exit(1);
    }

    console.log('\n✅ Dependencies installed successfully\n');

    // Run tests
    console.log('🚀 Running tests...\n');
    const test = spawn('npm', ['test'], { stdio: 'inherit' });

    test.on('close', (testCode) => {
        if (testCode === 0) {
            console.log('\n🎉 All tests passed!');
            console.log('\n📊 To see coverage report, run: npm run test:coverage');
            console.log('📚 To see API docs, start server and visit: http://localhost:3002/api-docs');
        } else {
            console.log('\n❌ Some tests failed');
            process.exit(testCode);
        }
    });
});