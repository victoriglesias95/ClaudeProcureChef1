// src/config.ts
export const config = {
  // API configuration
  API: {
    TIMEOUT_MS: 10000,
    RETRY_ATTEMPTS: 3,
  },
  
  // Feature flags for incomplete features
  FEATURES: {
    ENABLE_RECEIVING: false,
    ENABLE_REPORTING: false
  },
  
  // Application constants
  APP: {
    VERSION: '0.1.0',
    PAGE_SIZE: 20
  }
};