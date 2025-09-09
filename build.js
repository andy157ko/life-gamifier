// Simple build script for Netlify
// This ensures firebase-config.js is available during deployment

const fs = require('fs');

// Check if firebase-config.js exists locally
if (fs.existsSync('firebase-config.js')) {
    console.log('✅ firebase-config.js found - using local config');
} else {
    // Create firebase-config.js from environment variables if it doesn't exist
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    const configContent = `// Firebase Configuration (Generated during build)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Make it available globally
window.firebaseConfig = firebaseConfig;
`;

    fs.writeFileSync('firebase-config.js', configContent);
    console.log('✅ Generated firebase-config.js from environment variables');
}

console.log('🚀 Build complete - ready for deployment');
