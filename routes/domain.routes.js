const express = require('express');
const router = express.Router();
const { domainDB } = require('../config/db');
const auth = require('../middleware/auth');



/**
 * @route   POST /api/domain/create
 * @desc    สร้าง subdomain ใหม่
 * @access  Private
 * @body    {
 *            subdomain: string
 *          }
 */
router.post('/create', auth, async (req, res) => {
    try {
        const { subdomain } = req.body;
        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain must contain only lowercase letters, numbers, and hyphens'
            });
        }
        const domains = await domainDB.get('domains') || [];
        if (domains.some(d => d.subdomain === subdomain)) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain already exists'
            });
        }
        const newDomain = {
            userId: req.user.id,
            subdomain,
            createdAt: new Date()
        };

        await domainDB.push('domains', newDomain);

        res.json({
            success: true,
            message: 'Subdomain created successfully',
            domain: `${subdomain}.${process.env.DOMAIN}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/domain/list
 * @desc    ดู subdomain ทั้งหมดของผู้ใช้
 * @access  Private
 */
router.get('/list', auth, async (req, res) => {
    try {
        const domains = await domainDB.get('domains') || [];
        const userDomains = domains.filter(d => d.userId === req.user.id);
        res.json(userDomains);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/domain/:subdomain
 * @desc    ลบ subdomain
 * @access  Private
 */
router.delete('/:subdomain', auth, async (req, res) => {
    try {
        const { subdomain } = req.params;
        const domains = await domainDB.get('domains') || [];
        const domainIndex = domains.findIndex(d => 
            d.subdomain === subdomain && d.userId === req.user.id
        );

        if (domainIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Subdomain not found or not owned by user'
            });
        }
        domains.splice(domainIndex, 1);
        await domainDB.set('domains', domains);

        res.json({
            success: true,
            message: 'Subdomain deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 