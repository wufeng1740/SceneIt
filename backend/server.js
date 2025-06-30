require("dotenv").config({ path: "./config/.env" });
const defaults = require("./config/defaults");

const express = require("express");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const db = require("./common/db");
const session = require("express-session");
const passport = require("passport");
const helmet = require("helmet");

// Cache the db connection so its ready for later
db.connect();

// Initialise express
const server = express();

// Security: Use helmet on all requests to secure headers
// Helmet removes the x-powered-by header by default.
// Source: https://helmetjs.github.io/#x-powered-by
// server.use(helmet());
server.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "'unsafe-inline'", // string here
          "'unsafe-eval'", // for inline scripts and eval
        ],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'", // for Google Fonts
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://cdn.jsdelivr.net",
          "https://fonts.gstatic.com",
          "https://image.tmdb.org",
          "https://api.dicebear.com/",
        ],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        // For youtube movie trailers to display properly
        frameSrc: ["'self'", "https://www.youtube.com/embed/"],
      },
    },
  })
);
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(path.resolve(defaults.app.public_dir)));
server.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // We're not using secure cookies because that would require us to run HTTPS
    // We don't need that for this project (i.e. self-signing certificates)
  })
);
server.use(passport.initialize());
server.use(passport.session());

// Setup session
passport.serializeUser((user, callback) => {
  process.nextTick(() => {
    callback(null, { id: user.user_id, username: user.username });
  });
});

passport.deserializeUser((user, callback) => {
  process.nextTick(() => {
    return callback(null, user);
  });
});

// Load routes
const indexRouter = require("./routes/index.route");
const moviesRouter = require("./routes/movies.route.js");
const authRouter = require("./routes/auth.route");
const usersRouter = require('./routes/users.route.js');
const adminRouter = require('./routes/admin.route.js'); // for admin
const listsRouter = require('./routes/lists.route');
const testRouter = require('./routes/test.route.js'); // this router is just for testing purposes

// Routers to use
server.use("/", indexRouter);
server.use("/api/auth", authRouter);
server.use("/api/movies", moviesRouter);
server.use('/api/users', usersRouter); // API consistency
server.use('/admin', adminRouter); // for admin
server.use("/api/lists", listsRouter);
server.use("/test", testRouter); // this router is just for testing purposes

// catch 404 and forward to error handler
server.use(function(req, res, next) {
  next(createError(404));
});

// error handler
server.use(function(err, req, res, next) {
  const statusCode = err.status || 500;
  const responseMessage = err.message || 'Internal Server Error'; // Default message

  // Log the full error on the server for your debugging
  console.error(`[GENERIC ERROR HANDLER] Status: <span class="math-inline">\{statusCode\}, Message\: "</span>{err.message}"`, err.stack);

  res.status(statusCode).json({
    message: responseMessage, // Send 'message' key consistently
    // Optionally include stack in development for more details on the client-side if desired
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
});

// Handle a server shutdown by closing database connections
function gracefulShutdown() {
  db.disconnect();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = server;
