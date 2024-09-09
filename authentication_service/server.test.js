const request = require('supertest');
const app = require('./app.js'); // Import your app
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Endpoints', () => {

    // Clean up the database after all tests
    afterAll(async () => {
        await prisma.document.deleteMany(); // Delete documents first
        await prisma.service.deleteMany();  // Then delete services
        await prisma.customer.deleteMany(); // Finally delete customers
        await prisma.$disconnect();
    });

    let customerId;

    test('Register a new customer', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                f_name: 'Kaushik',
                l_name: 'Naik',
                email: 'kaushikaushik223@gmail.com',
                password: 'Kaushik@9876',
                phone_no: '1234567890',
                address: 'Udupi',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('customerId');
        customerId = res.body.customerId;
    });

    test('Verify email with OTP', async () => {
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });

        const res = await request(app)
            .post('/auth/verify-email')
            .send({
                email: customer.email,
                otp: customer.otp,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Email verified successfully');
    });

    test('Login with verified credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'kaushikaushik223@gmail.com',
                password: 'Kaushik@9876',
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Upload a document', async () => {
        const res = await request(app)
            .post(`/documents/upload?customerId=${customerId}`)
            .attach('document', 'C:/Users/e040042/Documents/Boootcamp_files/Trails/adhaar.png');

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Document uploaded successfully');
    });

    test('Select a service', async () => {
        const res = await request(app)
            .post('/services/select-service')
            .send({
                serviceName: 'Premium Support',
                customerId: customerId,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Service selected successfully');
    });

    test('Activate a service', async () => {
        const service = await prisma.service.findFirst({ where: { customerId: customerId } });

        const res = await request(app)
            .post('/services/activate-service')
            .send({
                serviceId: service.id,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Service activated successfully');
    });

    test('Get all services', async () => {
        const res = await request(app)
            .get('/services/get-services');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
    });
});
