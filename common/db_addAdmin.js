const argon2 = require("argon2");
const db = require('./db.js');

// const hashedPassword = await argon2.hash(req.body.password);
async function addAdminUser() {
    try {
        console.log("Adding admin user 'admin' with password 'admin123'");
        await db.query(`
            INSERT INTO users
                (username, avatar, password, date_of_birth, address, email, isAdmin)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            'admin',
            'images/logo_light-mode.png',
            await argon2.hash("admin123"),
            "1991-04-14",
            'Adelaide',
            'a1879322@adelaide.edu.au',
            true,
        ]);
    } catch (error) {
        console.error('Error adding admin user:', error);
    }
    db.disconnect();
}

module.exports = { addAdminUser };