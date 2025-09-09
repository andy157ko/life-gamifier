#!/bin/bash

# Life Gamifier - Firebase Configuration Setup Script

echo "🔐 Setting up Firebase configuration..."

# Check if firebase-config.js already exists
if [ -f "firebase-config.js" ]; then
    echo "⚠️  firebase-config.js already exists!"
    echo "   If you want to update it, please edit the file manually."
    echo "   Current file will be preserved."
else
    # Copy template to actual config file
    cp firebase-config-template.js firebase-config.js
    echo "✅ Created firebase-config.js from template"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Edit firebase-config.js with your actual Firebase configuration"
    echo "   2. Get your config from Firebase Console → Project Settings → Web App"
    echo "   3. Replace the placeholder values in firebase-config.js"
    echo ""
    echo "🔒 Security: firebase-config.js is automatically ignored by git"
fi

echo ""
echo "🚀 You're all set! Your API keys are now protected."
