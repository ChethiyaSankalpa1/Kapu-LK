const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../models/User');
const PremiumPlan = require('../models/PremiumPlan');
const PremiumGiftTransaction = require('../models/PremiumGiftTransaction');
const Notification = require('../models/Notification');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const giftController = require('../controllers/giftController');

let mongoReplSet;

beforeAll(async () => {
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoReplSet.getUri());
  await Promise.all([
    PremiumGiftTransaction.init(),
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
    PremiumPlan.deleteMany({}),
    PremiumGiftTransaction.deleteMany({}),
    Notification.deleteMany({}),
    Wallet.deleteMany({}),
    WalletTransaction.deleteMany({}),
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

const createMembers = async (balance = 10000, recipientFields = {}) => {
  const sender = await User.create({
    name: 'Gift Sender',
    email: 'sender@test.com',
    password: 'test-password',
  });
  const recipient = await User.create({
    name: 'Gift Recipient',
    email: 'recipient@test.com',
    password: 'test-password',
    ...recipientFields,
  });
  const plan = await PremiumPlan.create({
    name: 'Silver Plan',
    badge: 'silver',
    price: 1300,
    currency: 'LKR',
    durationDays: 21,
    isActive: true,
  });
  const wallet = await Wallet.create({ user: sender._id, balance });
  return { sender, recipient, plan, wallet };
};

const sendPremiumGift = (sender, recipient, key, overrides = {}) => {
  const req = {
    user: { _id: sender._id, name: sender.name },
    body: {
      to: String(recipient._id),
      planBadge: 'silver',
      idempotencyKey: key,
      amount: 1,
      ...overrides,
    },
  };
  const res = createResponse();
  return giftController.sendPremiumGift(req, res).then(() => res);
};

test('charges the database plan price, extends active validity, and notifies both users', async () => {
  const futureExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const { sender, recipient, wallet } = await createMembers(10000, {
    isPremium: true,
    premiumPlan: 'bronze',
    premiumStatus: 'active',
    premiumExpiresAt: futureExpiry,
  });

  const res = await sendPremiumGift(sender, recipient, 'gift-request-1');

  expect(res.statusCode).toBe(201);
  expect(res.body.amount).toBe(1300);
  expect(res.body.durationDays).toBe(21);
  expect(res.body.status).toBe('completed');

  const refreshedWallet = await Wallet.findById(wallet._id);
  expect(refreshedWallet.balance).toBe(8700);
  const updatedRecipient = await User.findById(recipient._id);
  expect(updatedRecipient.isPremium).toBe(true);
  expect(updatedRecipient.premiumPlan).toBe('silver');
  expect(Math.abs(updatedRecipient.premiumExpiresAt.getTime() - (futureExpiry.getTime() + 21 * 24 * 60 * 60 * 1000))).toBeLessThan(1000);

  const record = await PremiumGiftTransaction.findOne({ sender: sender._id });
  expect(record.recipient.toString()).toBe(recipient._id.toString());
  expect(record.planBadge).toBe('silver');
  expect(record.walletTransaction).toBeTruthy();
  expect(await WalletTransaction.countDocuments({ user: sender._id, relatedType: 'premium_gift' })).toBe(1);
  expect(await Notification.countDocuments({ user: sender._id, type: 'gift' })).toBe(1);
  expect(await Notification.countDocuments({ user: recipient._id, type: 'premium_activated' })).toBe(1);
});

test('replaying the same payment request returns its record without charging twice', async () => {
  const { sender, recipient, wallet } = await createMembers();

  const first = await sendPremiumGift(sender, recipient, 'gift-request-retry');
  const replay = await sendPremiumGift(sender, recipient, 'gift-request-retry');

  expect(first.statusCode).toBe(201);
  expect(replay.statusCode).toBe(200);
  expect(replay.body._id.toString()).toBe(first.body._id.toString());
  expect((await Wallet.findById(wallet._id)).balance).toBe(8700);
  expect(await PremiumGiftTransaction.countDocuments({ sender: sender._id })).toBe(1);
  expect(await WalletTransaction.countDocuments({ user: sender._id, relatedType: 'premium_gift' })).toBe(1);
});

test('rejects self-gifting without charging or creating a gift transaction', async () => {
  const { sender, wallet } = await createMembers();
  const res = await sendPremiumGift(sender, sender, 'gift-request-self');

  expect(res.statusCode).toBe(400);
  expect(await PremiumGiftTransaction.countDocuments({})).toBe(0);
  expect((await Wallet.findById(wallet._id)).balance).toBe(10000);
});

test('insufficient balance rolls back all gift and activation writes', async () => {
  const { sender, recipient, wallet } = await createMembers(100);
  const res = await sendPremiumGift(sender, recipient, 'gift-request-low-balance');

  expect(res.statusCode).toBe(400);
  expect(res.body.required).toBe(1300);
  expect(await PremiumGiftTransaction.countDocuments({})).toBe(0);
  expect((await Wallet.findById(wallet._id)).balance).toBe(100);
  expect((await User.findById(recipient._id)).isPremium).toBe(false);
  expect(await Notification.countDocuments({})).toBe(0);
});