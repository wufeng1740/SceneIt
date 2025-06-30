const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const authCtl = require("../controllers/auth.controller.js");
const argon2 = require("argon2");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Config values
const LOGIN_COOLOFF_HRS = 3;
const MAX_LOGIN_ATTEMPTS = 3;
const loginAttempts = {};


// Setup the passport strategy for local login
passport.use(new LocalStrategy(authCtl.verifyUser));

router.post("/signup", async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      const errMsg = "'username' and 'password' are required fields";
      throw new Error(errMsg);
    }

    // Hash the password using argon2 - no need for a salt
    // The library handles all this
    const hashedPassword = await argon2.hash(req.body.password);

    // Create a user by calling our controller
    const user = await authCtl.createUser(
      req.body.username,
      hashedPassword,
      req.body.birth_date,
      req.body.email,
    );

    res.type("json");
    res.send(user);
  } catch (err) {
    const signupErr = createError(
      400,
      err || `Failed to create user '${req.body.username}'`,
    );
    next(signupErr);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const loginDate = new Date(Date.now());
    const loginExpiryDate = new Date(Date.now() - LOGIN_COOLOFF_HRS * 60 * 60 * 1000);

    if (req.isAuthenticated()) {
      res.send(req.user);
      next();
    }

    if (!req.body.username || !req.body.password) {
      const errMsg = "'username' and 'password' are required fields";
      throw new Error(errMsg);
    }

    if (!(req.body.username in loginAttempts)) {
      loginAttempts[req.body.username] = [];
    }
    loginAttempts[req.body.username].push(loginDate);
    // Filter out any login attempts older than 24hrs
    const validAttempts = loginAttempts[req.body.username].filter(
      (an_attempt) => an_attempt > loginExpiryDate
    );

    // Check the number of valid logins  has not been exceeded
    if (validAttempts.length > MAX_LOGIN_ATTEMPTS) {
      throw new Error(`Too many failed login attempts. Try again in ${LOGIN_COOLOFF_HRS} hours.`);
    } else {
      // Passport assumes the username and password are named appropriately in the request
      // Otherwise, we need to specify a mapping
      passport.authenticate("local", { session: true }, (err, user, info) => {
        if (err) return next(err);

        if (!user) {
          const loginErr = createError(
            401,
            info.message || "Authentication failed",
          );
          next(loginErr);
        }

        // User authenticated?
        if (user) {
          // Clear the login attempts
          delete loginAttempts[user.username];

          // Store the session
          req.login(user, { session: true }, (loginErr) => {
            if (loginErr) return next(loginErr);

            res.cookie("username", user.username);
            if (user.password) delete user.password;

            return res.send(user);
          });
        }
      })(req, res, next);
    }
  } catch (err) {
    const loginErr = createError(401, err || "Failed to login ");
    next(loginErr);
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);

    res.clearCookie("username");
    res.json({ message: "Logged out" });
  });
});

router.use((err, _req, res, _next) => {
  res.type("json");
  res.status(err.status || 500);
  res.send({ error: err.message });
});

module.exports = router;
