// Configuration constants for the application
interface Config {
  environment: {
    isDev: boolean;
    isTest: boolean;
    isProd: boolean;
  };
  api: {
    baseUrl: string;
    authPath: string;
    oauthPath: string;
    genaiPath: string;
    google: {
      clientId: string;
      mapsApiKey: string;
    };
  };
  app: {
    name: string;
    version: string;
  };
}

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';
const isProduction = import.meta.env.PROD;

// Default API settings
const API_HOST = (import.meta.env.VITE_API_HOST as string | undefined)?.replace(/\/$/, '') || '';
const API_PORT = (import.meta.env.VITE_API_PORT as string | undefined) || '8080';
const API_ROOT_PATH = (import.meta.env.VITE_API_ROOT_PATH as string) || '';
const API_AUTH_PATH = API_ROOT_PATH + ((import.meta.env.VITE_API_AUTH_PATH as string) || '/auth');
const API_OAUTH_PATH = API_ROOT_PATH + ((import.meta.env.VITE_API_OAUTH_PATH as string) || '/oauth');
const API_GENAI_PATH = API_ROOT_PATH + ((import.meta.env.VITE_API_GENAI_PATH as string) || '/genai');

// Google OAuth
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

const config: Config = {
  // Environment info
  environment: {
    isDev: isDevelopment,
    isTest: isTest,
    isProd: isProduction,
  },

  api: {
    baseUrl: isProduction ? `${API_HOST}` : `${API_HOST}:${API_PORT}`,
    // baseUrl: `https://api.mizhifei.press`,
    authPath: API_AUTH_PATH,
    oauthPath: API_OAUTH_PATH,
    genaiPath: API_GENAI_PATH,

    // Google OAuth
    google: {
      clientId: GOOGLE_CLIENT_ID,
      mapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    },
  },

  // Application settings
  app: {
    name: 'Dentabot',
    version: '1.0.0',
  }
};

export default config;
