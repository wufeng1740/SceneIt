const db = require("../common/db.js");
const axios = require('axios');

const TMDB_API_KEY_FW = process.env.TMDB_API_ACCESS_TOKEN;

// Hardcoded genre dictionary to map TMDB genre IDs to genre names
const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction", // Sci-Fi genre
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};



// Add a movie by its TMDB external ID and return the movie_id
async function addSingleMovieByExtId(extId) {
    try {
        const apiKey = process.env.TMDB_API_KEY || TMDB_API_KEY_FW;
        if (!apiKey) {
            throw new Error("TMDB API key not configured. Please set TMDB_API_KEY.");
        }

        const tmdb = axios.create({
            baseURL: 'https://api.themoviedb.org/3',
            headers: {
                Authorization: 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Fetch movie data by external ID
        const { data: movie } = await tmdb.get(`/movie/${extId}?language=en-US`);

        const title = movie.title || movie.original_title || "Untitled";
        const overview = movie.overview || "";
        const releaseDate = movie.release_date || null;
        const posterPath = movie.poster_path;
        const thumbnail = posterPath ? `https://image.tmdb.org/t/p/w154${posterPath}` : null;
        const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : null;

        // Check if the movie already exists
        const selectRows = await db.query("SELECT movie_id FROM movie WHERE movie_ext_id = ?", [extId]);

        let movieId;
        if (selectRows.length > 0) {
            // Update existing movie
            movieId = selectRows[0].movie_id;
            await db.query(
                `UPDATE movie
                 SET title = ?, synopsis = ?, release_date = ?, thumbnail = ?, poster_url = ?
                 WHERE movie_id = ?`,
                [title, overview, releaseDate, thumbnail, posterUrl, movieId]
            );
            await db.query("DELETE FROM movie_tag WHERE movie_id = ?", [movieId]);
        } else {
            // Insert new movie
            const insertResult = await db.query(
                `INSERT INTO movie
                 (movie_ext_id, title, synopsis, release_date, thumbnail, poster_url)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [extId, title, overview, releaseDate, thumbnail, posterUrl]
            );
            movieId = insertResult.insertId;
        }

        // Insert genre tags
        if (movie.genres && Array.isArray(movie.genres)) {
            for (const genre of movie.genres) {
                const genreName = genre.name || "Unknown";
                await db.query("INSERT INTO movie_tag (movie_id, tag) VALUES (?, ?)", [movieId, genreName]);
            }
        }

        return movieId;
    } catch (error) {
        console.error("Error in addSingleMovieByExtId:", error);
        throw error;
    }
}

module.exports = { addSingleMovieByExtId };
