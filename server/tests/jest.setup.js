// Jest global setup: ensure NODE_ENV is 'test' so server.js skips app.listen and connectDB
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_jest';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_jest';
