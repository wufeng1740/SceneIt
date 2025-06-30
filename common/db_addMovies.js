/* eslint-disable no-await-in-loop */
/* eslint-disable no-multi-spaces */
const axios = require('axios');
const db = require('./db.js');
const targetCount = 20; // we want 200 movies

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

// async function fetchSciFiMovies(p = 1) {
//   try {
//     const { data } = await tmdb.get('/discover/movie', {
//       params: {
//         with_genres: 878, // Science Fiction
//         sort_by: 'popularity.desc', // by popularity
//         language: 'en-US', // English results
//         page: p
//       }
//     });
//     console.log('Sci-Fi movies:', data.results);
//     return data.results;
//   } catch (error) {
//     console.error('Failed to fetch Sci-Fi movies:', error);
//     throw error;
//   }
// }

async function addSciFiMovies() {
    // Test database connection
    try {
        await db.query("SELECT 1");
        console.log("Database connection successful.");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }

    // Use the TMDB API to fetch Sci-Fi movies
    try {
        console.log("Starting Sci-Fi movies fetch...");

        const apiKey = process.env.TMDB_API_KEY || TMDB_API_KEY_FW; // TMDB API key from environment
        if (!apiKey) {
        throw new Error("TMDB API key not configured. Please set TMDB_API_KEY.");
        }

        const tmdb = axios.create({
        baseURL: 'https://api.themoviedb.org/3',
        headers: {
            Authorization: 'Bearer '+ apiKey,
            'Content-Type': 'application/json'
        }
        });
        // TMDB API configuration
        const genreId_SF = 878;     // TMDB genre ID for Science Fiction

        let movies = [];
        let page = 1;

        // Fetch data from TMDB in pages until we have 200 movies or run out of results
        while (movies.length < targetCount) {
            const { data } = await tmdb.get('/discover/movie', {
                params: {
                with_genres: genreId_SF,
                sort_by: 'popularity.desc',
                language: 'en-US',
                page
                }
            });
            const tmdbResults = data.results;
            if (!tmdbResults || tmdbResults.length === 0) {
                break;  // no more results available
            }
            movies = movies.concat(tmdbResults);
            console.log(`Fetched page ${page} - accumulated ${movies.length} movies`);
            // If we've reached the last page available from TMDB, stop to avoid infinite loop
            if (data.page >= data.total_pages) {
                break;
            }
            page++;
        }

        // // Trim the movies array to the target count if we got more than needed
        // if (movies.length > targetCount) {
        //   movies = movies.slice(0, targetCount);
        // }

        let insertedCount = 0;
        let updatedCount = 0;

        // Upsert each movie into the database
        for (const movie of movies) {
            const extId = movie.id;                // TMDB movie ID (external ID)
            const title = movie.title || movie.original_title || "Untitled";
            const overview = movie.overview || "";
            const releaseDate = movie.release_date || null;
            const posterPath = movie.poster_path;  // e.g. "/abc123.jpg"
            // Construct image URLs using TMDB base URL and sizes
            const thumbnail = posterPath ? `https://image.tmdb.org/t/p/w154${posterPath}` : null;
            const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : null;

            // Check if movie already exists by its external ID
            let selectRows = null;
            try {
                selectRows = await db.query(
                    "SELECT movie_id FROM movie WHERE movie_ext_id = ?",
                    [extId]
                );
            } catch (error) {
                console.error("DB error:", error);
            }

            let movieId;
            if (selectRows.length > 0) {
                // Movie exists – perform an UPDATE
                movieId = selectRows[0].movie_id;
                await db.query(
                    `UPDATE movie
                       SET title = ?, synopsis = ?, release_date = ?, thumbnail = ?, poster_url = ?
                     WHERE movie_id = ?`,
                    [title, overview, releaseDate, thumbnail, posterUrl, movieId]
                );
                updatedCount++;
                console.log(`Updated movie [ID: ${movieId}, TMDB_ID: ${extId}] - "${title}"`);

                // Remove existing genre tags for this movie
                await db.query("DELETE FROM movie_tag WHERE movie_id = ?", [movieId]);
            } else {
                // Movie does not exist – perform an INSERT
                const insertResult = await db.query(
                    `INSERT INTO movie
                       (movie_ext_id, title, synopsis, release_date, thumbnail, poster_url)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [extId, title, overview, releaseDate, thumbnail, posterUrl]
                );
                // insertResult.insertId contains the new record's ID
                movieId = insertResult.insertId;
                insertedCount++;
                console.log(`Inserted movie [ID: ${movieId}, TMDB_ID: ${extId}] - "${title}"`);
            }

            // Insert genre tags into movie_tag table (one row per genre)
            if (movie.genre_ids && movie.genre_ids.length > 0) {
                for (const genreId of movie.genre_ids) {
                    const genreName = genreMap[genreId] || "Unknown";
                    await db.query(
                    "INSERT INTO movie_tag (movie_id, tag) VALUES (?, ?)",
                    [movieId, genreName]
                    );
                }
            }
        } // end for each movie

        console.log(`Sci-Fi movies upsert completed: ${insertedCount} inserted, ${updatedCount} updated.`);
        db.disconnect();
    } catch (error) {
    console.error("Error in addSciFiMovies:", error);
        throw error;
    }
}

// Export the function so it can be imported and run during server startup
module.exports = { addSciFiMovies };
