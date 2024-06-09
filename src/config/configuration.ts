// src/config/configuration.ts
export default () => ({
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
});
