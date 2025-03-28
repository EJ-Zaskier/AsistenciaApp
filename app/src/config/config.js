const DEV_MODE = false; // Cambia a false para producción

const DEV_CONFIG = {
  API_URL: "http://192.168.56.1:5000",
  TIMEOUT: 10000,
};

const PROD_CONFIG = {
  API_URL: "http://3.142.210.221:5000/api",
  TIMEOUT: 30000,
};

const Config = DEV_MODE ? DEV_CONFIG : PROD_CONFIG;

export default Config;