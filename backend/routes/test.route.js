// this router is just for testing purposes
var express = require('express');
const db = require('../common/db.js');
const multer = require('multer');
const path = require('path');
const argon2 = require("argon2");
var router = express.Router();
const { addSingleMovieByExtId } = require("../controllers/movie.controller.js");

router.get('/', (req, res) => {
  res.send('Test route is working!');
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




module.exports = router;