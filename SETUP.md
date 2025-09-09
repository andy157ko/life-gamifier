# Life Gamifier - Setup Instructions

## 🔐 Firebase Configuration Setup

To protect your API keys and sensitive information, follow these steps:

### 1. Create Firebase Configuration File

Copy the template file to create your actual configuration:

```bash
cp firebase-config-template.js firebase-config.js
```

### 2. Update Your Firebase Configuration

Edit `firebase-config.js` and replace the placeholder values with your actual Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### 3. Security Notes

- ✅ `firebase-config.js` is automatically ignored by git (see `.gitignore`)
- ✅ Your API keys will NOT be committed to the repository
- ✅ The template file (`firebase-config-template.js`) is safe to commit
- ✅ Never share your actual `firebase-config.js` file

### 4. Getting Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps" section
5. Click on your web app
6. Copy the configuration object

### 5. Firebase Project Setup

Make sure your Firebase project has:

- **Authentication** enabled with Google Sign-In
- **Firestore Database** enabled
- **Web app** registered with your domain

### 6. Environment Variables (Alternative)

For even better security, you can use environment variables:

```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
```

## 🚀 Deployment

When deploying to hosting services like Netlify, Vercel, or Firebase Hosting:

1. Make sure `firebase-config.js` is included in your deployment
2. Never commit the actual config file to your repository
3. Use environment variables for production deployments when possible

## 📁 File Structure

```
life-gamifier/
├── .gitignore                 # Ignores sensitive files
├── firebase-config.js         # Your actual config (IGNORED by git)
├── firebase-config-template.js # Template file (safe to commit)
├── SETUP.md                   # This file
└── ... (other app files)
```

## ⚠️ Important Security Reminders

- Never commit API keys to version control
- Use different Firebase projects for development and production
- Regularly rotate your API keys
- Monitor your Firebase usage for unusual activity
- Use Firebase Security Rules to protect your data
