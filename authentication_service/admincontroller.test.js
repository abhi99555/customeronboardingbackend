const request = require('supertest');
const app = require('./app.js'); // Import your Express app
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Admin API Endpoints', () => {

    // Clean up the database after all tests
    afterAll(async () => {
        await prisma.admin.deleteMany(); // Clean up the admins
        await prisma.$disconnect();
    });

    let adminId;
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@1234';

    test('Register a new admin', async () => {
        const res = await request(app)
            .post('/admin/register')
            .send({
                name: 'Admin User',
                email: adminEmail,
                password: adminPassword,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('admin');
        expect(res.body.admin).toHaveProperty('id');
        adminId = res.body.admin.id;
    });

    test('Attempt to register the same admin again', async () => {
        const res = await request(app)
            .post('/admin/register')
            .send({
                name: 'Admin User',
                email: adminEmail,
                password: adminPassword,
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Admin already exists');
    });

    test('Login with the registered admin', async () => {
        const res = await request(app)
            .post('/admin/login')
            .send({
                email: adminEmail,
                password: adminPassword,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Login with incorrect password', async () => {
        const res = await request(app)
            .post('/admin/login')
            .send({
                email: adminEmail,
                password: 'WrongPassword',
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });

});
