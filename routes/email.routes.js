const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { transport } = require('../config/smtp');
const { userDB, emailDB } = require('../config/db');

/**
 * @route   POST /api/email/send
 * @desc    ส่งอีเมล
 * @access  Private
 * @body    {
 *            to: string,
 *            subject: string,
 *            text: string,
 *            from: string,
 *            subdomain?: string
 *          }
 * @return  {
 *            success: boolean,
 *            message: string
 *          }
 */
router.post('/send', auth, async (req, res) => {
    try {
        const { to, subject, text } = req.body;

        const user = userDB.get('users')
            .find({ id: req.user.id })
            .value();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const fromAddress = `${user.username}@${user.subdomain}.${process.env.DOMAIN}`;

        const mailOptions = {
            from: fromAddress,
            to,
            subject,
            text
        };

        await transport.sendMail(mailOptions);

        emailDB.get('sentEmails')
            .push({
                userId: req.user.id,
                from: fromAddress,
                to,
                subject,
                text,
                date: new Date()
            })
            .write();

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/email/sent
 * @desc    ดูประวัติการส่งอีเมล
 * @access  Private
 * @return  Array<{
 *            userId: string,
 *            from: string,
 *            to: string,
 *            subject: string,
 *            text: string,
 *            date: Date
 *          }>
 */
router.get('/sent', auth, async (req, res) => {
    try {
        const emails = emailDB.get('sentEmails')
            .filter({ userId: req.user.id })
            .value();
        res.json(emails);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 