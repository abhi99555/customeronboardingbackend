const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const sendEmailWithOTP = require('../utils/emailservice');

const prisma = new PrismaClient();

const register = async (req, res) => {
    try {
        const { f_name, l_name, email, password, phone_no, address } = req.body;
       const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        const customer = await prisma.Customer.create({
            data: {
                first_name: f_name,
                last_name: l_name,
                email: email,
                password: hashedPassword,
                phone_no: phone_no,
                address: address,
                otp: otp, // Store OTP in the database
                isVerified: false // Set verification status to false initially
            },
        });
      
        console.log("Customer registered, sending OTP...");
        
        await sendEmailWithOTP(customer.email, "Email Verification OTP", otp);
        console.log("OTP sent");
        const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'Customer registered. OTP sent for email verification.', customerId: customer.id ,token:token});
        
        
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ message: 'Error registering customer', error });
    }
};

const verifyEmailWithOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const customer = await prisma.Customer.findUnique({ where: { email } });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (customer.otp === parseInt(otp)) {
            await prisma.Customer.update({
                where: { email },
                data: { isVerified: true, otp: null }, // Clear the OTP after successful verification
            });

            res.status(200).json({ message: 'Email verified successfully', customerId: customer.id });

        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await prisma.Customer.findUnique({ where: { email } });

        if (!customer || !await bcrypt.compare(password, customer.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!customer.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
};
module.exports={register,login,verifyEmailWithOTP};
