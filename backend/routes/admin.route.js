var express = require('express');
const db = require('../common/db.js');
const argon2 = require("argon2");
var router = express.Router();

// isAuthenticated test
router.use(async (req, res, next) => {
    if (!req.isAuthenticated()) {
        // console.log("User not authenticated");
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    const userId = req.user.id;
    // console.log("User authenticated, userId: ", userId);
    const result = await db.query('SELECT isAdmin FROM users WHERE user_id = ?', [userId]);
    // console.log("User isAdmin: ", result);
    if (result.length === 0 || !result[0].isAdmin) {
        console.log("User is not an admin");
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
});

// get all users for admin page
router.get('/getuserslist', async function(req, res, next) {
    try {
        const result = await db.query('SELECT * FROM users');
        // console.log(rows);
        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'No users found' });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add a new user
router.post('/adduser', async function(req, res, next) {
    try {
        let {
            username,
            avatar,
            password,
            date_of_birth,
            address,
            email,
            isAdmin,
        } = req.body;

        // Validate date_of_birth
        const validDateOfBirth = date_of_birth && !isNaN(Date.parse(date_of_birth)) ? date_of_birth : null;

        // hash password
        password = await argon2.hash(password);

        const sql = `
            INSERT INTO users
                (username, avatar, password, date_of_birth, address, email, isAdmin)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            username,
            avatar,
            password,
            date_of_birth,
            address,
            email,
            isAdmin,
        ]);

        res.status(201).json({
            userId: result.insertId,
            message: 'User added successfully'
        });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Edit an existing user
router.put('/edituser', async function(req, res, next) {
    try {
        let {
            user_id,
            username,
            avatar,
            password,
            date_of_birth,
            address,
            email,
            isAdmin
        } = req.body;


        // check password
        const userPassword = await db.query('SELECT password FROM users WHERE user_id = ?', [user_id]);
        if (userPassword.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (password !== userPassword[0].password) {
            password = await argon2.hash(password);
        }

        // Validate date_of_birth
        const validDateOfBirth = date_of_birth && !isNaN(Date.parse(date_of_birth)) ? date_of_birth : null;

        const sql = `
            UPDATE users
            SET
                username = ?,
                avatar = ?,
                password = ?,
                date_of_birth = ?,
                address = ?,
                email = ?,
                isAdmin = ?
            WHERE user_id = ?
        `;
        const result = await db.query(sql, [
            username,
            avatar,
            password,
            date_of_birth,
            address,
            email,
            isAdmin,
            user_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete a user
router.delete('/deleteuser', async function(req, res, next) {
    try {
        const { user_id } = req.body;

        const sql = 'DELETE FROM users WHERE user_id = ?';
        const result = await db.query(sql, [user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;