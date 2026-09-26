const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const userController = require('../controllers/userController');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('profile avatar selection is persisted and returned to the client', async () => {
  const user = await User.create({
    name: 'Test Member',
    email: 'avatar@test.com',
    password: 'test-password',
  });
  const res = createResponse();

  await userController.updateProfile({
    user: { _id: user._id },
    body: { profileAvatar: 'neutral-2' },
  }, res);

  expect(res.statusCode).toBe(200);
  expect(res.body.profileAvatar).toBe('neutral-2');
  expect((await User.findById(user._id)).profileAvatar).toBe('neutral-2');
});

test('profile avatar selection rejects unsupported preset IDs', async () => {
  const user = await User.create({
    name: 'Test Member',
    email: 'invalid-avatar@test.com',
    password: 'test-password',
  });
  const res = createResponse();

  await userController.updateProfile({
    user: { _id: user._id },
    body: { profileAvatar: 'external-image-url' },
  }, res);

  expect(res.statusCode).toBe(400);
  expect((await User.findById(user._id)).profileAvatar).toBe('');
});