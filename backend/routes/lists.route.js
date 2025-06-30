const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const listsCtl = require("../controllers/lists.controller.js");

router.get("/show", async (req, res, next) => {
  // Could move this to a 'use' at the top of this router, but then the message
  // would be generic. The context is useful the user (i.e. myself when debugging)
  if (!req.isAuthenticated()) {
    const authError = createError(400, "You must be logged in to view lists");
    next(authError);
  }

  // User ID will be in the session (along with username)
  const movieLists = await listsCtl.getListsByUser(req.user.id);
  res.send({ movie_lists: movieLists });
});

// Create a list
router.post("/add", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      const errMsg = "You must be logged in to add new lists";
      throw new Error(errMsg);
    }

    if (!req.body || !req.body.list_name || !req.body.list_description) {
      const errMsg = "'list_name' and 'list_description' are required fields";
      throw new Error(errMsg);
    }

    const list_id = await listsCtl.createList(
      req.user.id,
      req.body.list_name,
      req.body.list_description,
    );
    // { list_id: xx }
    res.send(list_id);
  } catch (err) {
    // Send the error back to the client
    const listErr = createError(400, err.message);
    next(listErr);
  }
});

router.post("/add_movie", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      const errMsg = "You must be logged in to add a movie to lists";
      throw new Error(errMsg);
    }
    const { list_id, movie_ext_id } = req.body;
    if (!list_id || !movie_ext_id) {
        throw new Error("A list ID and movie ID must be provided.");
    }
    const result = await listsCtl.addMovieToList(list_id, null, movie_ext_id);
    res.send(result);
  } catch (err) {
    // Send the error back to the client
    const listErr = createError(400, err.message);
    next(listErr);
  }
});

router.post("/update/:listId", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      const errMsg = "You must be logged in to update a movie list";
      throw new Error(errMsg);
    }

    if (
      !req.params ||
      !req.params.listId ||
      !req.body.list_name ||
      !req.body.list_description
    ) {
      const errMsg =
        "'list_id', 'list_name' and 'list_description' are required fields";
      throw new Error(errMsg);
    }

    await listsCtl.updateList(
      req.params.listId,
      req.body.list_name,
      req.body.list_description,
    );
    res.send({ success: true });
  } catch (err) {
    // Send the error back to the client
    const listErr = createError(400, err.message);
    next(listErr);
  }
});

router.delete("/delete/:listId", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      const errMsg = "You must be logged in to delete a movie list";
      throw new Error(errMsg);
    }

    if (
      !req.params ||
      !req.params.listId
    ) {
      const errMsg = "'list_id' is are required field";
      throw new Error(errMsg);
    }

    // This will error if it fails
    await listsCtl.deleteList(
      req.params.listId
    );
    res.send({ success: true });
  } catch (err) {
    // Send the error back to the client
    const listErr = createError(400, err.message);
    next(listErr);
  }
});


router.get("/list/:listId", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      const errMsg = "You must be logged in to view a list";
      throw new Error(errMsg);
    }

    if (!req.params.listId) {
      const errMsg = "'listId' is required";
      throw new Error(errMsg);
    }

    // check if the list exists for the user
    const movieLists = await listsCtl.getListsByUser(req.user.id);
    // console.log("Result from getListsByUser:", movieLists);
    const listId = Number(req.params.listId);
    // console.log("Movie lists for user:", movieLists, "; List ID:", listId, "User ID:", req.user.id);
    let isListAvailable = false;
    for (const movieList of movieLists) {
      if (movieList.list_id === listId) {
        isListAvailable = true;
        break;
      }
    }
    if (!isListAvailable) {
      const errMsg = `List with ID '${listId}' does not exist for user '${req.user.username}'`;
      throw new Error(errMsg);
    }

    // Get the movies in the list
    const Movies = await listsCtl.getListMoviesById(listId);
    // console.log("Movies in list:", Movies);
    // change format of release_date to YYYY-MM-DD
    Movies.forEach((movie) => {
      if (movie.release_date) {
        movie.release_date = new Date(movie.release_date)
          .toISOString()
          .split("T")[0];
      }
    });
    res.send(Movies);
  } catch (err) {
    // Send the error back to the client
    const listErr = createError(400, err.message);
    next(listErr);
  }
});

router.use((err, _req, res, _next) => {
  res.type("json");
  res.status(err.status || 500);
  res.send({ error: err.message });
});

module.exports = router;
