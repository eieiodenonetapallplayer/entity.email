const nodemailer = require('nodemailer');
const { SMTPServer } = require('smtp-server');
const { emailDB } = require('./db');
const fs = require('fs');
const path = require('path');

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const smtpServer = new SMTPServer({
    secure: true,
    // key: fs.readFileSync(path.join(__dirname, '../certs/private.key')),
    // cert: fs.readFileSync(path.join(__dirname, '../certs/certificate.crt')),
    authMethods: ['PLAIN', 'LOGIN'],
    onAuth(auth, session, callback) {
        if (auth.username === process.env.SMTP_USER && 
            auth.password === process.env.SMTP_PASS) {
            callback(null, { user: auth.username });
        } else {
            callback(new Error('Invalid username or password'));
        }
    },
    onData(stream, session, callback) {
        let emailData = '';
        stream.on('data', (chunk) => {
            emailData += chunk;
        });

        stream.on('end', async () => {
            try {
                emailDB.get('receivedEmails')
                    .push({
                        from: session.envelope.mailFrom.address,
                        to: session.envelope.rcptTo.map(r => r.address),
                        data: emailData,
                        date: new Date()
                    })
                    .write();
                callback();
            } catch (err) {
                callback(new Error('Error saving email'));
            }
        });
    }
});

module.exports = { transport, smtpServer }; 