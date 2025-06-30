var express = require('express');
const db = require('../common/db.js');
const multer = require('multer');
const path = require('path');
const argon2 = require("argon2");
var router = express.Router();
const sharp = require('sharp');
const fs = require('fs');
const { addSingleMovieByExtId } = require("../controllers/movie.controller.js");

// test session
router.get("/session", (req, res) => {
    console.log("this is session info: ", req.session, req.user);
    res.send("this is session info: " + JSON.stringify(req.session) + JSON.stringify(req.user));
});

// isAuthenticated test
router.use((req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    // already logged in, return user data
    // res.json({
    //     message: 'data from /test route',
    //     user: req.user
    // });
    next();
});

// // Middleware to check if user is authenticated
// function ensureAuthenticated(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.status(401).json({ message: 'Authentication required. Please log in.' });
// }

// ---------------------------------------------------------------
//  multer to save file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/avatars'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// check file type
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // accept file
    } else {
        cb(new Error('only accept JPEG, JPG, PNG & GIF image file!'), false); // reject file
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // limit file size <= 5MB
});

router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const inputFile = req.file.path;
        const outputFile = path.join(__dirname, '../public/avatars/resized-' + req.file.filename);
        // AI-assisted snippet: ChatGPT suggested using sharp for image resizing
        // sharp to resize file - will be failed if the file is not an image
        await sharp(inputFile)
            .resize(200, 200) // resize to 200x200 pixels
            .toFile(outputFile);
        // delete the original file
        fs.unlinkSync(inputFile);


        // return image path
        res.status(200).json({
            message: 'Avatar uploaded successfully!',
            filePath: `/avatars/resized-${req.file.filename}`
        });
    } catch (error) {
        if (req.file && req.file.path) {
            // delete the original file if it exists
            try { fs.unlinkSync(req.file.path) } catch {}
        }
        const resizedPath = path.join(__dirname, '../public/avatars/resized-' + req.file.filename);
        if (fs.existsSync(resizedPath)) {
            try { fs.unlinkSync(resizedPath) } catch {}
        }
        console.error('Error when resizing:', error);
        return res.status(400).json({ message: 'It is not a valid image' });
    }
});

router.post('/update-avatar', async (req, res) => {
    try {
        const userId = req.user.id;
        const { avatar } = req.body;

        // Validate input
        if (!avatar) {
            return res.status(400).json({ message: 'Avatar is required.' });
        }

        // Query to update user avatar
        const sql = `
            UPDATE users
            SET avatar = ?
            WHERE user_id = ?
        `;

        // Execute the query
        await db.query(sql, [avatar, userId]);

        res.status(200).json({
            message: 'User avatar updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating user avatar:', error);
        // Check for specific SQL errors if necessary, e.g., foreign key constraints
        if (error.sqlState && error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Update password
router.put('/update-password', async function(req, res, next) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
        // Check if current password is correct
        const user = await db.query('SELECT password FROM users WHERE user_id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await argon2.verify(user[0].password, currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        // Hash the new password
        const hashedNewPassword = await argon2.hash(newPassword);
        // Update the password in the database
        const sql = `
            UPDATE users
            SET password = ?
            WHERE user_id = ?
        `;
        await db.query(sql, [hashedNewPassword, userId]);
        res.status(200).json({
            message: 'User password updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating user password:', error);
        if (error.sqlState && error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Get user account information
router.get('/info', async function(req, res, next) {
    try {
        // // Check if user is logged in
        // if (!req.user || !req.user.id) {
        //     console.log(req.user);
        //     return res.status(401).json({ message: 'User not authenticated' });
        // }

        const userId = req.user.id;

        // Query to get user information
        const userQuery = `
            SELECT username, avatar, date_of_birth, address, email, isAdmin
            FROM users
            WHERE user_id = ?
        `;

        // Execute queries
        const result = await db.query(userQuery, [userId]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Format the response
        const userData = result[0];

        res.status(200).json({
            user: userData,
        });

    } catch (error) {
        console.error('Error fetching user account information:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// update user account information
router.put('/update', async function(req, res, next) {
    try {
        const userId = req.user.id;
        const { username, date_of_birth, address, email } = req.body;

        // Validate input
        if (!username || !date_of_birth || !email) {    // address is optional
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if the username already exists for another user
        const rows = await db.query('SELECT user_id FROM users WHERE username = ? AND user_id != ?', [username, userId]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Username already taken by another user.' });
        }

        // Check if the email already exists for another user
        const emailRows = await db.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, userId]);
        if (emailRows.length > 0) {
            return res.status(400).json({ message: 'Email already taken by another user.' });
        }

        // Query to update user information
        const sql = `
            UPDATE users
            SET username = ?, date_of_birth = ?, address = ?, email = ?
            WHERE user_id = ?
        `;

        // Execute the query
        await db.query(sql, [username, date_of_birth, address, email, userId]);
        res.cookie("username", username);
        res.status(200).json({
            message: 'User account information updated successfully'
        });
    } catch (error) {
        console.error('Error updating user account information:', error);
        // Check for specific SQL errors if necessary, e.g., foreign key constraints
        if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'This username or email already exists.' });
    }
        // if (error.sqlState && error.sqlMessage) {
        //     console.error('SQL Error:', error.sqlMessage);
        // }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete user account
// Delete a user
router.delete('/delete', async function(req, res, next) {
    try {
        const { username } = req.body;
        const userId = req.user.id;
        // check if the user is existing
        const userCheck = await db.query('SELECT user_id FROM users WHERE username = ?', [username]);
        if (userCheck.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = userCheck[0].user_id;
        // check if the user is trying to delete their own account
        if (user_id !== userId) {
            return res.status(403).json({ message: 'You can only delete your own account.' });
        }

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

// Add a new user_movie entry
router.post('/addusermovie', async function(req, res, next) {
    try {
        const { user_id, movie_id, rating, comment } = req.body;
        console.log('SQL params:', user_id, movie_id, rating, comment);
        const sql = `
            INSERT INTO user_movie
                (user_id, movie_id, rating, comment)
            VALUES
                (?, ?, ?, ?)
        `;
        const result = await db.query(sql, [user_id, movie_id, rating, comment]);

        res.status(201).json({
            message: 'User movie entry added successfully'
        });
    } catch (error) {
        console.error('Error adding user movie entry:', error.message);
        console.error('SQL Message:', error.sqlMessage);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// add a new user list
router.post('/adduserlist', async function(req, res, next) {
    try {
        const { user_id, list_name, description } = req.body;

        const sql = `
            INSERT INTO user_list
                (user_id, name, description)
            VALUES
                (?, ?, ?)
        `;
        const result = await db.query(sql, [user_id, list_name, description]);

        res.status(201).json({
            list_id: result.insertId,
            message: 'User list added successfully'
        });
    } catch (error) {
        console.error('Error adding user list:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// add a new list movie
router.post('/addlistmovie', async function(req, res, next) {
    try {
        const { list_id, movie_id } = req.body;

        const sql = `
            INSERT INTO list_movie
                (list_id, movie_id)
            VALUES
                (?, ?)
        `;
        const result = await db.query(sql, [list_id, movie_id]);

        res.status(201).json({
            message: 'List movie entry added successfully'
        });
    } catch (error) {
        console.error('Error adding list movie entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addlistmovieext/:ext_id', async function(req, res, next) {
    try {
        const { list_id } = req.body;
        const movie_ext_id = req.params.ext_id; // Get the movie_ext_id from the URL parameter

        if (!list_id || !movie_ext_id) {
            return res.status(400).json({ message: 'List ID and Movie External ID are required.' });
        }

        // Add the movie to the database using the external ID
        const movie_id = await addSingleMovieByExtId(movie_ext_id);
        if (!movie_id) {
            return res.status(404).json({ message: 'Movie not found or could not be added.' });
        }
        // Insert the movie into the list_movie table
        const sql = `
            INSERT INTO list_movie
                (list_id, movie_id)
            VALUES
                (?, ?)
        `;
        await db.query(sql, [list_id, movie_id]);
        res.status(201).json({
            message: 'List movie entry added successfully',
            movie_id: movie_id
        });
    } catch (error) {
        console.error('Error adding list movie entry:', error);
        // Check for specific SQL errors if necessary, e.g., foreign key constraints
        if (error.sqlState && error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add a movie to the user's blocked list ("never me again")
router.post('/block-movie', async function(req, res, next) {
    try {
        console.log('Entering /block-movie route.'); // Basic entry log

        const userId = req.user.id; // Assuming req.user contains the authenticated user's details, including id
        const { movieId } = req.body; // This should be the TMDB movie ID (movie_ext_id)

        if (!movieId) {
            return res.status(400).json({ message: 'Movie ID is required.' });
        }

        // Check if already blocked to prevent duplicate entries, though DB constraint would also catch this
        const checkSql = "SELECT * FROM user_blocked_movies WHERE user_id = ? AND movie_ext_id = ?";
        const existingBlock = await db.query(checkSql, [userId, movieId]);

        if (existingBlock.length > 0) {
            return res.status(200).json({ message: 'Movie already blocked by this user.' });
        }

        const sql = `
            INSERT INTO user_blocked_movies
                (user_id, movie_ext_id)
            VALUES
                (?, ?)
        `;
        await db.query(sql, [userId, movieId]);

        res.status(201).json({
            message: 'Movie added to your "don\'t show me again" list successfully.'
        });
    } catch (error) {
        console.error('Error blocking movie:', error.message);
        // Check for specific SQL errors if necessary, e.g., foreign key constraints
        if (error.sqlState && error.sqlMessage) {
             console.error('SQL Error:', error.sqlMessage);
        }
        // Ensure req.user exists and has an id property
        if (!req.user || !req.user.id) {
            console.error('User not authenticated or user.id missing in /block-movie');
            // It might be better to rely on ensureAuthenticated to catch this,
            // but as a fallback:
            return res.status(401).json({ message: 'Authentication error or user ID missing.' });
        }
        res.status(500).json({ message: 'Internal server error while blocking movie.' });
    }
});

module.exports = router;
