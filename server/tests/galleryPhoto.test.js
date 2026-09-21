const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const {
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  setMainGalleryPhoto,
  reorderGalleryPhotos,
  getUserById,
} = require('../controllers/userController');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Profile Photo Management & Premium Quota Test Suite', () => {
  let freeUser;
  let premiumUser;
  let expiredUser;

  beforeEach(async () => {
    await User.deleteMany({});

    freeUser = await User.create({
      name: 'Free User',
      email: 'free@example.com',
      password: 'password123',
      isPremium: false,
      premiumPlan: null,
      premiumStatus: 'none',
      profileImageUrl: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/free_main.jpg',
      photos: [
        {
          url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/free_main.jpg',
          publicId: 'matrimonial_profiles/free_main',
          isMain: true,
          order: 0,
        },
      ],
    });

    premiumUser = await User.create({
      name: 'Premium User',
      email: 'premium@example.com',
      password: 'password123',
      isPremium: true,
      premiumPlan: 'gold',
      premiumStatus: 'active',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      profileImageUrl: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_1.jpg',
      photos: [
        {
          url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_1.jpg',
          publicId: 'matrimonial_profiles/prem_1',
          isMain: true,
          order: 0,
        },
      ],
    });

    expiredUser = await User.create({
      name: 'Expired User',
      email: 'expired@example.com',
      password: 'password123',
      isPremium: true,
      premiumPlan: 'silver',
      premiumStatus: 'active',
      premiumExpiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
      profileImageUrl: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/exp_1.jpg',
      photos: [
        {
          url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/exp_1.jpg',
          publicId: 'matrimonial_profiles/exp_1',
          isMain: true,
          order: 0,
        },
        {
          url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/exp_2.jpg',
          publicId: 'matrimonial_profiles/exp_2',
          isMain: false,
          order: 1,
        },
        {
          url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/exp_3.jpg',
          publicId: 'matrimonial_profiles/exp_3',
          isMain: false,
          order: 2,
        },
      ],
    });
  });

  test('Free user cannot upload a second photo (Quota enforcement = 1)', async () => {
    const req = {
      user: { _id: freeUser._id },
      file: {
        buffer: Buffer.from('fake image content'),
        mimetype: 'image/jpeg',
      },
      body: {},
    };

    let statusCode;
    let jsonResponse;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          },
        };
      },
      json: (data) => {
        jsonResponse = data;
      },
    };

    await uploadGalleryPhoto(req, res);

    assert.strictEqual(statusCode, 403, 'Should reject extra photo with 403 Forbidden');
    assert.strictEqual(jsonResponse.requiresPremium, true);
  });

  test('Premium user can set a photo as main', async () => {
    // Add second photo to premium user
    premiumUser.photos.push({
      url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg',
      publicId: 'matrimonial_profiles/prem_2',
      isMain: false,
      order: 1,
    });
    await premiumUser.save();

    const targetPhotoId = premiumUser.photos[1]._id.toString();

    const req = {
      user: { _id: premiumUser._id },
      params: { photoId: targetPhotoId },
    };

    let jsonResponse;
    const res = {
      status: () => ({ json: (d) => { jsonResponse = d; } }),
      json: (data) => { jsonResponse = data; },
    };

    await setMainGalleryPhoto(req, res);

    assert.strictEqual(jsonResponse.success, true);
    assert.strictEqual(jsonResponse.profileImageUrl, 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg');

    const updated = await User.findById(premiumUser._id);
    assert.strictEqual(updated.profileImageUrl, 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg');
    assert.strictEqual(updated.photos[1].isMain, true);
    assert.strictEqual(updated.photos[0].isMain, false);
  });

  test('Deleting main photo auto-promotes remaining photo to main', async () => {
    premiumUser.photos.push({
      url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg',
      publicId: 'matrimonial_profiles/prem_2',
      isMain: false,
      order: 1,
    });
    await premiumUser.save();

    const mainPhotoId = premiumUser.photos[0]._id.toString();

    const req = {
      user: { _id: premiumUser._id },
      params: { photoId: mainPhotoId },
    };

    let jsonResponse;
    const res = {
      status: () => ({ json: (d) => { jsonResponse = d; } }),
      json: (data) => { jsonResponse = data; },
    };

    await deleteGalleryPhoto(req, res);

    assert.strictEqual(jsonResponse.success, true);
    assert.strictEqual(jsonResponse.photos.length, 1);
    assert.strictEqual(jsonResponse.photos[0].isMain, true);
    assert.strictEqual(jsonResponse.profileImageUrl, 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg');
  });

  test('Deleting the only remaining photo clears profileImageUrl without error', async () => {
    const mainPhotoId = freeUser.photos[0]._id.toString();

    const req = {
      user: { _id: freeUser._id },
      params: { photoId: mainPhotoId },
    };

    let jsonResponse;
    const res = {
      status: () => ({ json: (d) => { jsonResponse = d; } }),
      json: (data) => { jsonResponse = data; },
    };

    await deleteGalleryPhoto(req, res);

    assert.strictEqual(jsonResponse.success, true);
    assert.strictEqual(jsonResponse.photos.length, 0);
    assert.strictEqual(jsonResponse.profileImageUrl, '');

    const updated = await User.findById(freeUser._id);
    assert.strictEqual(updated.profileImageUrl, '');
    assert.strictEqual(updated.photos.length, 0);
  });

  test('Reordering photos correctly updates order and synchronizes main photo', async () => {
    premiumUser.photos.push({
      url: 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/prem_2.jpg',
      publicId: 'matrimonial_profiles/prem_2',
      isMain: false,
      order: 1,
    });
    await premiumUser.save();

    const id1 = premiumUser.photos[0]._id.toString();
    const id2 = premiumUser.photos[1]._id.toString();

    const req = {
      user: { _id: premiumUser._id },
      body: { photoIds: [id2, id1] },
    };

    let jsonResponse;
    const res = {
      status: () => ({ json: (d) => { jsonResponse = d; } }),
      json: (data) => { jsonResponse = data; },
    };

    await reorderGalleryPhotos(req, res);

    assert.strictEqual(jsonResponse.success, true);
    assert.strictEqual(jsonResponse.photos[0]._id.toString(), id2);
    assert.strictEqual(jsonResponse.photos[1]._id.toString(), id1);
  });

  test('Expired premium user: extra photos are preserved, but public visibility exposes only main photo', async () => {
    // Other member views expired user's profile
    const req = {
      user: { _id: freeUser._id, role: 'user' },
      params: { id: expiredUser._id.toString() },
    };

    let jsonResponse;
    const res = {
      status: () => ({ json: (d) => { jsonResponse = d; } }),
      json: (data) => { jsonResponse = data; },
    };

    await getUserById(req, res);

    // Photos array for other viewer should contain only 1 photo
    assert.strictEqual(jsonResponse.photos.length, 1);
    assert.strictEqual(jsonResponse.photos[0].url, 'https://res.cloudinary.com/test/image/upload/v1/matrimonial_profiles/exp_1.jpg');

    // But in database, all 3 photos are safely preserved!
    const dbUser = await User.findById(expiredUser._id);
    assert.strictEqual(dbUser.photos.length, 3);
  });
});
