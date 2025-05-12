import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';
import { resolve } from 'path';
import '@jest/globals';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
}); 