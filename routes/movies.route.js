const express = require('express');
const axios = require('axios');
const createError = require('http-errors');
const router = express.Router();
const db = require('../common/db.js');

// Cache (if you keep it, ensure it handles pages or is cleared appropriately for paginated content)
// For simplicity with pagination, direct fetching might be easier unless sophisticated cache management is implemented.
// const apiCache = { ... };
// const CACHE_DURATION_MS = 60 * 60 * 1000;

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_ACCESS_TOKEN = process.env.TMDB_API_ACCESS_TOKEN;
const SCI_FI_GENRE_ID = 878; // Define Sci-Fi genre ID

async function getBlockedMovieIds(userId) {
    if (!userId) {
        return [];
    }
    try {
        const sql = "SELECT movie_ext_id FROM user_blocked_movies WHERE user_id = ?";
        const rows = await db.query(sql, [userId]);
        return rows.map(row => row.movie_ext_id.toString());
    } catch (error) {
        console.error("Error fetching blocked movie IDs:", error);
        return [];
    }
}

async function fetchFromTMDB(endpoint, params = {}) {
    if (!TMDB_ACCESS_TOKEN) {
        console.error('TMDB Access Token is missing.');
        throw createError(500, 'TMDB Access Token is not configured on the server.');
    }
    const url = `${TMDB_API_BASE_URL}${endpoint}`;
    console.log(`Fetching from TMDB URL: ${url} with params:`, params);

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'accept': 'application/json'
            },
            params: params,
            timeout: 5000
        });
        console.log(`Successfully fetched from ${url}`);
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
             console.error(`Error fetching from TMDB endpoint ${endpoint}: Timeout after 5000ms`);
             throw createError(504, 'Request to TMDB API timed out.');
        }
        if (error.response) {
            console.error(`Error fetching from TMDB endpoint ${endpoint}: Status ${error.response.status}`, error.response.data);
            throw createError(error.response.status, error.response.data.status_message || 'Error contacting TMDB API');
        } else if (error.request) {
            console.error(`Error fetching from TMDB endpoint ${endpoint}: No response received`, error.request);
            throw createError(503, 'No response received from TMDB API.');
        } else {
            console.error(`Error fetching from TMDB endpoint ${endpoint}: Request setup error`, error.message);
            throw createError(500, `Error setting up request to TMDB API: ${error.message}`);
        }
    }
}

// In GET /api/movies/popular
router.get('/popular', async (req, res, next) => {
    console.log("Handling GET /api/movies/popular");
    const userId = req.user ? req.user.id : null;

    // Get page from query, default to 1. Ensure it's a positive integer.
    let page = parseInt(req.query.page, 10) || 1;
    if (isNaN(page) || page < 1) {
        page = 1; // Default to page 1 if invalid
    }

    console.log(`Fetching page ${page} of popular SCI-FI movies from TMDB.`);
    try {
        const params = {
            sort_by: 'popularity.desc',
            with_genres: SCI_FI_GENRE_ID.toString(), // Ensure Sci-Fi genre is used
            page: page
        };
        let tmdbData = await fetchFromTMDB('/discover/movie', params);

        let blockedIds = [];
        if (userId) {
            blockedIds = await getBlockedMovieIds(userId);
        }

        const allFetchedMovies = tmdbData.results || [];
        const nonBlockedMovies = allFetchedMovies.filter(movie => !blockedIds.includes(movie.id.toString()));

        const simplifiedPopularMovies = nonBlockedMovies.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            genre_ids: movie.genre_ids
        }));

        const responseData = {
            page: tmdbData.page,
            results: simplifiedPopularMovies,
            total_pages: tmdbData.total_pages,
            total_results: tmdbData.total_results
        };

        res.json(responseData);

    } catch (error) {
        console.error(`Error in /popular (sci-fi, page ${page}) route handler:`, error.message);
        next(error);
    }
});


// ... other routes (/search, /discover, /:movieId, etc.) ...
router.get('/search', async (req, res, next) => {
    console.log(`Handling GET /api/movies/search with query: ${req.query.query}`);
    const query = req.query.query;
    if (!query) {
        return next(createError(400, 'Search query parameter "query" is required.'));
    }
    const userId = req.user ? req.user.id : null;

    try {
        const params = {
            query: query,
            include_adult: false,
            language: 'en-US',
            page: req.query.page || 1
        };
        const rawTMDBData = await fetchFromTMDB('/search/movie', params);

        let blockedIds = [];
        if (userId) {
            blockedIds = await getBlockedMovieIds(userId);
        }

        const sciFiMovies = rawTMDBData.results
            ? rawTMDBData.results.filter(movie =>
                movie.genre_ids && movie.genre_ids.includes(SCI_FI_GENRE_ID)
              )
            : [];

        const nonBlockedSciFiMovies = sciFiMovies.filter(movie => !blockedIds.includes(movie.id.toString()));

        const responseData = {
            page: rawTMDBData.page,
            results: nonBlockedSciFiMovies,
            total_pages: rawTMDBData.total_pages,
            total_results: rawTMDBData.total_results
        };

        console.log(`TMDB found ${rawTMDBData.results ? rawTMDBData.results.length : 0} movies. Filtered to ${sciFiMovies.length} sci-fi. Then to ${nonBlockedSciFiMovies.length} non-blocked sci-fi movies.`);
        res.json(responseData);

    } catch (error) {
        console.error("Error in /search route handler (sci-fi filtered):", error.message);
        next(error);
    }
});

router.get('/discover', async (req, res, next) => {
    const genreIdsString = req.query.with_genres;
    if (!genreIdsString) {
        return next(createError(400, 'Genre IDs parameter "with_genres" is required.'));
    }

    // Ensure Sci-Fi (878) is always included
    let genreIdsArray = genreIdsString.split(',').map(id => parseInt(id.trim(), 10));
    if (!genreIdsArray.includes(SCI_FI_GENRE_ID)) {
        genreIdsArray.push(SCI_FI_GENRE_ID);
    }
    const finalGenreIds = [...new Set(genreIdsArray)].join(','); // Remove duplicates if any and join back

    console.log(`Handling GET /api/movies/discover with genres: ${finalGenreIds}`);
    const userId = req.user ? req.user.id : null;

    try {
        const params = {
            sort_by: 'popularity.desc',
            with_genres: finalGenreIds,
            page: req.query.page || 1,
            language: 'en-US'
        };

        const data = await fetchFromTMDB('/discover/movie', params);

        let finalResults = data.results || [];

        if (userId && finalResults.length > 0) {
            const blockedIds = await getBlockedMovieIds(userId);
            finalResults = finalResults.filter(movie => !blockedIds.includes(movie.id.toString()));
        }

        // Further ensure all results are Sci-Fi (though 'with_genres' should handle this)
        finalResults = finalResults.filter(movie => movie.genre_ids && movie.genre_ids.includes(SCI_FI_GENRE_ID));

        const responseData = {
            page: data.page,
            results: finalResults,
            total_pages: data.total_pages,
            total_results: data.total_results
        };

        res.json(responseData);

    } catch (error) {
        console.error("Error in /discover route handler:", error.message);
        next(error);
    }
});

router.get('/:movieId', async (req, res, next) => {
    const movieId = req.params.movieId;
    console.log(`Handling GET /api/movies/${movieId}`);
    if (!movieId || isNaN(parseInt(movieId))) {
         return next(createError(400, 'Valid numeric movie ID parameter is required.'));
    }
    const userId = req.user ? req.user.id : null;

    try {
        if (userId) {
            const blockedIds = await getBlockedMovieIds(userId);
            if (blockedIds.includes(movieId.toString())) {
                return next(createError(404, 'Movie not found or has been hidden by the user.'));
            }
        }

        const params = {
            language: 'en-US',
            append_to_response: 'videos,credits'
         };
        const data = await fetchFromTMDB(`/movie/${movieId}`, params);

        const topCast = data.credits?.cast
            .slice(0, 10)
            .map(actor => ({
                id: actor.id,
                name: actor.name,
                character: actor.character,
                profile_path: actor.profile_path
            })) || [];

        const trailer = data.videos?.results?.find(
            video => video.site === 'YouTube' && video.type === 'Trailer' && video.official === true
        );
        const trailerKey = trailer ? trailer.key : null;

        const simplifiedDetails = {
            id: data.id,
            title: data.title,
            overview: data.overview,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            release_date: data.release_date,
            vote_average: data.vote_average,
            runtime: data.runtime,
            genres: data.genres?.map(g => g.name) || [],
            cast: topCast,
            trailer_youtube_key: trailerKey
        };
        res.json(simplifiedDetails);

    } catch (error) {
         console.error(`Error in /:movieId route handler (ID: ${movieId}):`, error.message);
         next(error);
    }
});

router.get('/:movieId/recommendations', async (req, res, next) => {
    const movieId = req.params.movieId;
    console.log(`Handling GET /api/movies/${movieId}/recommendations`);
    if (!movieId || isNaN(parseInt(movieId))) {
         return next(createError(400, 'Valid numeric movie ID parameter is required.'));
    }
    const userId = req.user ? req.user.id : null;

    try {
        const params = {
            language: 'en-US',
            page: 1 // TMDB recommendations are typically paginated, but for this, one page is usually enough.
         };
        const data = await fetchFromTMDB(`/movie/${movieId}/recommendations`, params);

        let recommendedMovies = data.results || [];

        // Filter for Sci-Fi movies
        recommendedMovies = recommendedMovies.filter(movie =>
            movie.genre_ids && movie.genre_ids.includes(SCI_FI_GENRE_ID)
        );

        if (userId && recommendedMovies.length > 0) {
            const blockedIds = await getBlockedMovieIds(userId);
            recommendedMovies = recommendedMovies.filter(movie => !blockedIds.includes(movie.id.toString()));
        }

        // Simplify the movie objects if needed, or send as is from TMDB (already quite minimal for lists)
        const finalResults = recommendedMovies.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            genre_ids: movie.genre_ids // Keep genre_ids for any client-side display or further use
        }));


        const responseData = {
            ...data, // Spread original data like page, total_pages, etc.
            results: finalResults // Override results with the filtered and possibly simplified ones
        };

        res.json(responseData);
    } catch (error) {
         console.error(`Error in /:movieId/recommendations route handler (ID: ${movieId}):`, error.message);
         next(error);
    }
});

router.get('/genres/list', async (req, res, next) => {
    console.log("Handling GET /api/movies/genres/list");
    console.log("Fetching genres from TMDB.");
    try {
        const params = { language: 'en' };
        const data = await fetchFromTMDB('/genre/movie/list', params);
        res.json(data);
    } catch (error) {
        console.error("Error in /genres/list route handler:", error.message);
        next(error);
     }
});


module.exports = router;