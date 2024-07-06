const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const { User, Organisation } = require('../models');

describe('Token Generation', () => {
  it('should generate a token with correct user details', () => {
    const user = { userId: '123', email: 'test@example.com' };
    const token = jwt.sign(user, process.env.JWT_SECRET)

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(user.userId);
    expect(decoded.email).toBe(user.email);
  });

  it('should expire token at the correct time', () => {
    const user = { userId: '123', email: 'test@example.com' };
    const token = generateToken(user);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresIn = Math.floor(decoded.exp - decoded.iat);
    expect(expiresIn).toBe(3600);
  });
});

describe('Organisation Access', () => {
  let userToken;
  let user2Token;
  let organisation;

  beforeAll(async () => {
    const user = await User.create({  });
    const user2 = await User.create({  });
    organisation = await Organisation.create({  });
    await user.addOrganisation(organisation);

    userToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET);
    user2Token = jwt.sign({ userId: user2.userId }, process.env.JWT_SECRET);
  });

  it('should allow access to user’s own organisation', async () => {
    const res = await request(app)
      .get(`/api/organisations/${organisation.orgId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orgId).toBe(organisation.orgId);
  });

  it('should not allow access to another user’s organisation', async () => {
    const res = await request(app)
      .get(`/api/organisations/${organisation.orgId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
  });
});

describe('User Registration', () => {
  afterEach(async () => {
    await User.destroy({ where: {} });
    await Organisation.destroy({ where: {} });
  });

  it('should register user successfully with default organisation', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('john.doe@example.com');
    expect(res.body.data.user.firstName).toBe('John');

    const user = await User.findOne({ where: { email: 'john.doe@example.com' } });
    const organisation = await Organisation.findOne({ where: { name: "John's Organisation" } });
    expect(organisation).not.toBeNull();
  });

  it('should log the user in successfully', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('john.doe@example.com');
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('firstName');
  });

  it('should fail if there’s duplicate email or userId', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    expect(res.status).toBe(422);
  });
});
