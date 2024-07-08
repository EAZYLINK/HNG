const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const { sequelize, User, Organisation } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true }); 
});

describe('Token Generation', () => {
  it('should generate a token with correct user details', () => {
    const user = { userId: '123', email: 'test@example.com' };
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'})

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(user.userId);
    expect(decoded.email).toBe(user.email);
  });

  it('should expire token at the correct time', () => {
    const user = { userId: '123', email: 'test@example.com' };
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'});

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
    const user = await User.create({
      userId: '123',
      firstName: 'first',
      lastName: 'second',
      email: 'me@example.com',
      password: 'mypass'
      });
    const user2 = await User.create({ 
      userId: '123',
      firstName: 'first1',
      lastName: 'second2',
      email: 'me@example.com2',
      password: 'mypass2'
     });
    organisation = await Organisation.create({ 
      orgId: '72727',
      name: 'myorg',
      description: ''
     });
    await user.addOrganisation(organisation);

    userToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {expiresIn: '1h'});
    user2Token = jwt.sign({ userId: user2.userId }, process.env.JWT_SECRET, {expiresIn: '1h'});
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

  it('should register user successfully with a default organization', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password',
        phone: '1234567890',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data.accessToken');
    expect(response.body.data.user.firstName).toBe('John');
    expect(response.body.data.user.email).toBe('john.doe@example.com');
    const organisation = await Organisation.findOne({ where: { name: "John's Organisation" } });
    expect(organisation).not.toBeNull();
  });

  it('should log the user in successfully', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.accessToken');
    expect(response.body.data.user.email).toBe('john.doe@example.com');
  });

  it('should fail if required fields are missing', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        lastName: 'Doe',
        email: 'john.doe2@example.com',
        password: 'password',
        phone: '1234567890',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Unsuccessful registration');
  });

  it('should fail if there’s duplicate email or userId', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe2@example.com',
        password: 'password',
        phone: '1234567890',
      });

    const response = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe2@example.com',
        password: 'password123',
        phone: '0987654321',
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Duplicate email');
  });
});

// afterAll(async () => {
//   await sequelize.close();
// });