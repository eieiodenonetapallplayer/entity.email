const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { userDB, domainDB } = require('../config/db');

/**
 * @route   POST /api/auth/register
 * @desc    สมัครสมาชิกใหม่พร้อมสร้าง subdomain
 * @access  Public
 * @body    {
 *            username: string,
 *            email: string,
 *            password: string,
 *            subdomain: string     // เพิ่ม subdomain ในการลงทะเบียน
 *          }
 * @return  {
 *            success: boolean,
 *            message: string,
 *            token: string
 *          }
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, subdomain } = req.body;

        if (!username || !email || !password || !subdomain) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const users = userDB.get('users').value();
        if (users.some(user => user.username === username || user.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        const domains = domainDB.get('domains').value();
        if (domains.some(d => d.subdomain === subdomain)) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();

        userDB.get('users')
            .push({
                id: userId,
                username,
                email,
                password: hashedPassword,
                subdomain,
                createdAt: new Date()
            })
            .write();

        domainDB.get('domains')
            .push({
                userId,
                subdomain,
                createdAt: new Date()
            })
            .write();

        const token = jwt.sign(
            { id: userId, username: username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            email: `${username}@${subdomain}.${process.env.DOMAIN}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    เข้าสู่ระบบ
 * @access  Public
 * @body    {
 *            username: string,
 *            password: string
 *          }
 * @return  {
 *            success: boolean,
 *            message: string,
 *            token: string
 *          }
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = userDB.get('users')
            .find({ username })
            .value();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            email: `${user.username}@${user.subdomain}.${process.env.DOMAIN}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/auth/profile
 * @desc    ดูข้อมูลผู้ใช้
 * @access  Private
 * @return  {
 *            id: string,
 *            username: string,
 *            email: string,
 *            role: string,
 *            createdAt: Date
 *          }
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = userDB.get('users')
            .find({ id: req.user.id })
            .value();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 