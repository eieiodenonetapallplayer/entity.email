const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const userAdapter = new FileSync('./data/users.json');
const emailAdapter = new FileSync('./data/emails.json');
const domainAdapter = new FileSync('./data/domains.json');

const userDB = lowdb(userAdapter);
const emailDB = lowdb(emailAdapter);
const domainDB = lowdb(domainAdapter);

userDB.defaults({ users: [] }).write();
emailDB.defaults({ sentEmails: [], receivedEmails: [] }).write();
domainDB.defaults({ domains: [] }).write();

module.exports = {
    userDB,
    emailDB,
    domainDB
}; 