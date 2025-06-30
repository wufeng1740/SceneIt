const db = require("../common/db.js");
const movieCtl = require("./movie.controller.js"); // Import the movie controller

async function getListsByUser(user_id) {
  const sql_get_list = `
    SELECT
      ul.list_id,
      ul.name,
      ul.description,
      ul.created_at
    FROM
      user_list ul
    WHERE
      ul.user_id = ?`;

  const movie_lists = await db.query(sql_get_list, [user_id]);

  // If nothing found let the caller handle it - don't throw an error

  return movie_lists;
}

// Throws an error when the list already exists
async function createList(user_id, list_name, list_description) {
  // First check the user doesn't already have the list
  const user_lists = await getListsByUser(user_id);

  for (const a_list of user_lists) {
    if (a_list.name === list_name) {
      throw new Error(
        `A list named '${list_name}' already exists. Pick another name.`,
      );
    }
  }

  const sql_create_list = `
    INSERT INTO
      user_list (
        user_id,
        name,
        description
      )
    VALUES
      (?, ?, ?);`;

  const sql_get_list = `
    SELECT
      ul.list_id
    FROM
      user_list ul
    WHERE
      ul.user_id = ?
      AND ul.name = ?`;

  await db.query(sql_create_list, [user_id, list_name, list_description]);

  // Now check it created and return the ID
  const result = await db.query(sql_get_list, [user_id, list_name]);

  if (!result) {
    throw new Error(`Failed to create list '${list_name}'.`);
  }
  const list_id = result[0];

  return list_id;
}

async function resolveExternalMovieId(movie_ext_id) {
  const get_movie_sql = `
    SELECT
      m.movie_id
    FROM
      movie m
    WHERE
      m.movie_ext_id = ?`;

  const result = await db.query(get_movie_sql, [movie_ext_id]);

  // If the movie exists in our DB, return its internal ID
  if (result && result.length > 0) {
    return result[0].movie_id;
  }

  // If the movie is not in our DB, add it
  try {
    const newMovieId = await movieCtl.addSingleMovieByExtId(movie_ext_id);
    return newMovieId;
  } catch (error) {
    console.error(`Failed to add movie with external ID ${movie_ext_id} to the database:`, error);
    throw new Error("The selected movie could not be added to the database at this time.");
  }
}

async function addMovieToList(list_id, movie_id, movie_ext_id) {
  // Get the movie ID from the external one if needed
  if (!movie_id && movie_ext_id) {
    movie_id = await resolveExternalMovieId(movie_ext_id);
  }

  // Assuming movie_id & list_id are valid... because the world needs more optimism
  const sql_get_movie_list = `
    SELECT
      lm.movie_id
    FROM
      list_movie lm
    WHERE
      lm.list_id = ?
      AND lm.movie_id = ?`;

  // Just check if the movie's already in the list
  const list_has_movie = await db.query(sql_get_movie_list, [
    list_id,
    movie_id,
  ]);

  if (list_has_movie?.length > 0) {
    throw new Error("This movie's already in the selected list");
  }

  // Movie's not in the list yet - let's add it
  const add_movie_sql = `
    INSERT INTO
      list_movie (
        list_id,
        movie_id
      )
    VALUES
      (?, ?)`;

  await db.query(add_movie_sql, [list_id, movie_id]);

  // Now check the movie was added... back to pessimism :(
  const result = await db.query(sql_get_movie_list, [list_id, movie_id]);

  if (!result || result == []) {
    throw new Error("Failed to add movie to list!");
  }

  return { success: "Movie added to list" };
}

async function getListMoviesById(list_id) {
  const sql_get_movies = `
    SELECT
      lm.movie_id,
      m.movie_ext_id,
      m.title,
      m.release_date,
      m.thumbnail
    FROM
      list_movie lm
    JOIN
      movie m ON lm.movie_id = m.movie_id
    WHERE
      lm.list_id = ?`;

  const movies = await db.query(sql_get_movies, [list_id]);

  // If nothing found let the caller handle it - don't throw an error

  return movies;
}

async function updateList(list_id, list_name, list_description) {
  const sql_update_list = `
    UPDATE
      user_list
    SET
      name = ?,
      description = ?
    WHERE
      list_id = ?`;

  await db.query(sql_update_list, [list_name, list_description, list_id]);

  return true;
}

async function deleteList(list_id) {
  const sql_delete_list = `
    DELETE FROM
      user_list
    WHERE
      list_id = ?`;

  await db.query(sql_delete_list, [list_id]);

  return true;
}
module.exports = {
  getListsByUser,
  createList,
  addMovieToList,
  getListMoviesById,
  updateList,
  deleteList,
};