// Build script for Netlify - replaces placeholder values with environment variables
const fs = require('fs');

// Read the firebase-config.js file
let configContent = fs.readFileSync('firebase-config.js', 'utf8');

// Replace placeholder values with environment variables
configContent = configContent.replace(/REPLACE_WITH_ENV_VAR/g, (match, offset, string) => {
  // This is a simple replacement - in a real build, you'd want more sophisticated logic
  return 'process.env.FIREBASE_' + 'VALUE';
});

// For now, let's use a simpler approach - replace with actual values from env vars
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY_HERE',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

// Generate the final config file
const finalConfig = `// Firebase Configuration (Generated during build)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Make it available globally
window.firebaseConfig = firebaseConfig;
`;

// Write the updated config file
fs.writeFileSync('firebase-config.js', finalConfig);
console.log('✅ Generated firebase-config.js from environment variables');
