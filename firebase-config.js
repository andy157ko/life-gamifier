// Firebase Configuration
// This file will be replaced during Netlify build with real values from environment variables

const firebaseConfig = {
  apiKey: "REPLACE_WITH_ENV_VAR",
  authDomain: "REPLACE_WITH_ENV_VAR",
  projectId: "REPLACE_WITH_ENV_VAR",
  storageBucket: "REPLACE_WITH_ENV_VAR",
  messagingSenderId: "REPLACE_WITH_ENV_VAR",
  appId: "REPLACE_WITH_ENV_VAR",
  measurementId: "REPLACE_WITH_ENV_VAR"
};

// Make it available globally
window.firebaseConfig = firebaseConfig;