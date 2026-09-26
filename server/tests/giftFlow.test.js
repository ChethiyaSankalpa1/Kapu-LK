const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../models/User');
const { Gift, GiftTransaction } = require('../models/Gift');
const { UserStats } = require('../models/Achievement');
const PremiumPlan = require('../models/PremiumPlan');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const giftController = require('../controllers/giftController');
const premiumController = require('../controllers/premiumController');

let mongoReplSet;

beforeAll(async () => {
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(mongoReplSet.getUri());
  await Promise.all([
    GiftTransaction.init(),
    UserStats.init(),
    Wallet.init(),
    WalletTransaction.init(),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoReplSet.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Gift.deleteMany({}),
    GiftTransaction.deleteMany({}),
    UserStats.deleteMany({}),
    PremiumPlan.deleteMany({}),
    Wallet.deleteMany({}),
    WalletTransaction.deleteMany({}),
    Notification.deleteMany({}),
    Message.deleteMany({}),
  ]);
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

const createMembers = async (balance = 1000, points = 0) => {
  const sender = await User.create({
    name: 'Gift Sender',
    email: 'sender@gift-test.com',
    password: 'test-password',
  });
  const recipient = await User.create({
    name: 'Gift Recipient',
    email: 'recipient@gift-test.com',
    password: 'test-password',
  });
  const wallet = await Wallet.create({ user: sender._id, balance });
  await UserStats.create({ user: sender._id, points });
  return { sender, recipient, wallet };
};

const sendGift = (sender, recipient, gift, key, overrides = {}) => {
  const req = {
    user: { _id: sender._id, name: sender.name },
    body: {
      to: String(recipient._id),
      giftId: String(gift._id),
      idempotencyKey: key,
      ...overrides,
    },
  };
  const res = createResponse();
  return giftController.sendGift(req, res).then(() => res);
};

test('GET gifts safely filters premium gifts with sanitizeFilter enabled', async () => {
  const regularGift = await Gift.create({ name: 'Rose', emoji: '🌹', price: 100, currency: 'LKR' });
  await Gift.create({ name: 'Diamond Ring', emoji: '💍', price: 1000, currency: 'LKR', isPremium: true });
  const res = createResponse();

  await giftController.getGifts({}, res);

  expect(res.statusCode).toBe(200);
  expect(res.body.map((gift) => String(gift._id))).toEqual([String(regularGift._id)]);
});

test('GET gifts seeds a default catalog when there are no active gifts', async () => {
  const res = createResponse();

  await giftController.getGifts({}, res);

  expect(res.statusCode).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body.every((gift) => gift.isActive && !gift.isPremium)).toBe(true);
});

test('replaying a regular gift request does not charge the wallet twice', async () => {
  const { sender, recipient, wallet } = await createMembers();
  const gift = await Gift.create({ name: 'Rose', emoji: '🌹', price: 100, currency: 'LKR' });

  const first = await sendGift(sender, recipient, gift, 'regular-gift-retry');
  const replay = await sendGift(sender, recipient, gift, 'regular-gift-retry');

  expect(first.statusCode).toBe(201);
  expect(replay.statusCode).toBe(200);
  expect(replay.body._id.toString()).toBe(first.body._id.toString());
  expect((await Wallet.findById(wallet._id)).balance).toBe(900);
  expect(await GiftTransaction.countDocuments({ from: sender._id })).toBe(1);
  expect(await WalletTransaction.countDocuments({ user: sender._id, relatedType: 'gift' })).toBe(1);
  expect(await Notification.countDocuments({ user: recipient._id, type: 'gift_received' })).toBe(1);
});

test('points-priced gifts debit points and do not debit wallet funds', async () => {
  const { sender, recipient, wallet } = await createMembers(1000, 40);
  const gift = await Gift.create({ name: 'Heart', emoji: '❤️', price: 25, currency: 'POINTS' });

  const res = await sendGift(sender, recipient, gift, 'points-gift-once');

  expect(res.statusCode).toBe(201);
  expect(res.body.paymentAmount).toBe(25);
  expect(res.body.paymentCurrency).toBe('POINTS');
  expect((await Wallet.findById(wallet._id)).balance).toBe(1000);
  expect((await UserStats.findOne({ user: sender._id })).points).toBe(20);
  expect(await WalletTransaction.countDocuments({ user: sender._id, relatedType: 'gift' })).toBe(0);
});

test('insufficient points do not create a gift or debit the account', async () => {
  const { sender, recipient, wallet } = await createMembers(1000, 10);
  const gift = await Gift.create({ name: 'Heart', emoji: '❤️', price: 25, currency: 'POINTS' });

  const res = await sendGift(sender, recipient, gift, 'points-gift-low-balance');

  expect(res.statusCode).toBe(400);
  expect(res.body.required).toBe(25);
  expect((await Wallet.findById(wallet._id)).balance).toBe(1000);
  expect((await UserStats.findOne({ user: sender._id })).points).toBe(10);
  expect(await GiftTransaction.countDocuments({})).toBe(0);
});

test('Premium plan fetch preserves database-configured price and validity', async () => {
  await PremiumPlan.create({
    name: 'Configured Silver',
    badge: 'silver',
    price: 2345,
    currency: 'LKR',
    durationDays: 45,
    isActive: true,
  });
  const res = createResponse();

  await premiumController.getPlans({}, res);

  const silverPlan = res.body.find((plan) => plan.badge === 'silver');
  expect(silverPlan.price).toBe(2345);
  expect(silverPlan.durationDays).toBe(45);
});