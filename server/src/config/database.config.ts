import { config } from './app.config';

export const databaseConfig = {
  uri: config.mongodbUri,
  options: {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};
