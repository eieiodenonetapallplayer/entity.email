const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('./middleware/auth');
const path = require('path');
const { smtpServer } = require('./config/smtp');
const { userDB, emailDB, domainDB } = require('./config/db');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(express.static('public'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/views', 'index.html'));
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/email', require('./routes/email.routes'));
app.use('/api/domain', require('./routes/domain.routes'));

const SMTP_PORT = 2525;
smtpServer.listen(SMTP_PORT, () => {
    console.log(`SMTP Server is running on port ${SMTP_PORT}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HTTP Server is running on port ${PORT}`);
    console.log(`Email server is configured for domain: ${process.env.DOMAIN}`);
}); 