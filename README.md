# Group Repository for COMP SCI 2207/7207 Web & Database Computing Web Application Project (2023 Semester 1)

Your group's shared repository for the WDC 2023 Web App Project.

Auto commit/push/sync to Github is disabled by default in this repository.  
- Enable the GitDoc extension to use this fucntionality (either in your VSCode settings, or in the Dev Container settings)

See [HERE](https://myuni.adelaide.edu.au/courses/85266/pages/2023-web-application-group-project-specification) for the project specification.

We recommend using the 'Shared Repository Model (Branch & Pull)' to collaborate on your work in this single repostory.  
- You can read more about collaborating on GitHub repositories [HERE](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests)
- When working on the same file at the same time, the 'Live Share' feature in VSCode can also help.

# Project Overview

SceneIt is a minimalist movie discovery service for sci-fi lovers who want to quickly find their next favorite film.
Through integration with The Movie Database (TMDB) API and our custom backend, SceneIt allows users to search, explore, and discover science fiction movies with minimal effort.

The Homepage always recommends the most popular sci-fi movie when users first visited the site.

Users can search movies by keywords, filter results by genre, rating, or release date, and view detailed information for each movie including title, synopsis, rating, and poster. On the discover page, users can select up to three genres in addition to science fiction to explore recommended movies that closely match their preferences.

SceneIt’s uniqueness lies in its genre-based discovery, efficient filtering, and personalized movie saving system. Logged-in users can add movies to their personal list for future viewing, while admins can manage user accounts through a secured admin panel.

All user data, search filters, and saved movies are managed through our custom SQL database, ensuring scalability and efficient backend operations.

# Setup instructions for running the app:

We've made a file called `sceneit_init.sh` to help you initialise the server automatically. When running it, you're just required to provide the TMDB API key, which is provided below (please keep it secret). After that, you can just simply run the server using `npm run dev`. 

All commands you need are shown below:

```bash
# Initialize server (use the TMDB API key provided below)
chmod +x sceneit_init.sh
./sceneit_init.sh
	# the file 'sceneit_init.sh' help you complete all the work as below:
		# Environment Setup
		# Dependency Installation
		# Database Initialisation

# TMDB API key (please keep it secret)
eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NjFiN2ZmNDI5OTQ0MmM0NzQyYzIyMTNmOWYyYThhOCIsIm5iZiI6MTc0Mzc0NTQ3Ny44NTYsInN1YiI6IjY3ZWY3MWM1YTkzMTNjNzE4NGFkMDIyOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8Lj1RVFkcHbLv2Zy2TtW4fva7nGaY4g19jE1A-cSkuw

# Start the development server
npm run dev
```

In case you want to login into the database, infomation (database username and password) is saved in the `.env` file :`/backend/config/.env`.

# Features and Functionality

- **Movie Recommendations**  
  Recommends sci-fi films based on movie popularity ranking.

- **Minimalist Discovery Interface**  
  Displays 1 recommendations on the home page each time to reduce decision fatigue.

- **User Interaction & Movie List System**  
  Users can mark movies as ‘Seen’, ‘Interested’, etc, or add movie to customised movie list

- **User Accounts**  
  Includes user registration, login/logout, and role-based access control.

- **Movie Discoverer Functioon**  
  Interactive tool to refine recommendations based on user preferences.

- **Smart Filtering**  
  Recommendations exclude disliked films.

- **Movie Details Page**  
  Each film displays title, synopsis, poster, rating, release date, runtime, and trailer link.

- **Admin Panel**  
  Admin users can manage user accounts (add/edit/delete).

- **Dark Mode Support**  
  Built-in dark mode toggle for better user experience.


# Key Architectural Decisions
## Security and Best Practices
- Input validation on forms (client and server side)
- Account lockout after multiple attempts
- SQL parameter binding for dynamic values (instead of string concatenation)
- Session cookies (with secret), with no PII stored in cookies
- Password hashing and salting via argon2
- Protected pages (redirect to login on unauthenticated attempt)
- Helmet.js for headers (x-powered-by disabled by default). Content security policies implemented.

## Performance and Optimisation
- Server-side caching for movie API requests
- Client-side paging for fetched movies
- Database connection management via a helper (no need for pooling as there's only ever one connection. Instead rely on in-memory cache for connection management - i.e. we load the db connection once, re-use it via the helper and close it when the server terminates).

## Database Design & Normalisation
- The database is primarily in 3rd Normal Form, as the key transitive dependencies have been eliminated. There are however minor exceptions such as movie.language. We drew the line at whether someone was a feature or just merely an attribute.
- We've designed the database with modularity and flexibility in mind, so as not to be constrained by the third-party API. E.g. we use an external id to link a movie to a 3rd party API service; genres are implemented as 'tags'; and our movie preferences ('seen', 'favourites', 'wartch later') are tracked as 'movie lists' rather than bespoke 'actions'.

## Scalability and Maintainability
- Our server architecture is modular with a clear separation of concerns. Each route is aligned with a particular domain which is in turn aligned with a set of features.
- In most cases (but not all) our logic is handled by controllers, which primarily act as a middle layer between the database and the server. This allows us to keep our router logic light and re-use particular database related logic (e.g. fetching movie details may be used in more than one router, but use the same controller).
- We purposely chose not to implement database connection pooling but would have if we needed to handle multiple concurrent database connections.
- In most of the app we use a standard error handling method on th eserver and client side. On the server we use a generic error handler that catches unhandled router errors. On the client side we use toaster messages to relay those errors back to the user.
- Our server settings are controlled by configuration files: '.env' file for local settings not checked into version control; 'defaults.js' for default settings used across the app to fall back on.
- Common functionality used across the server and client are offloaded to helpers or common modules/libraries to allow for re-use. (E.g. getting cookie attributes; toaster messages; database query handling).

# Known Bugs and Limitations

- The website has known functionality issues on the Safari browser.
- A brief flicker of incorrect UI elements (e.g., loading and error messages appearing simultaneously) may be visible on the Homepage and Movie Details page when they first load.


# Citations
- Vue.js. (2025). *Vue 3 Reference Guide [Official Documentation].* https://vuejs.org/guide/
- Express.js. (n.d.). *Express 5.x - API Reference [Official Documentation].* https://expressjs.com/en/5x/api.html
- Express.js. (n.d.). *Using session middleware.* https://expressjs.com/en/resources/middleware/session.html
- 7Span. (2025). *Material UI Colors, v6.3.10 [Color Codes].* https://materialui.co/colors
- Vegter, M. (2016, July 20). *How to generate a random string? [Online forum post]. Unix & Linux Stack Exchange* https://unix.stackexchange.com/a/306107
- Walton, J. (2022). *passport-api-docs [Documentation]. GitHub.* https://github.com/jwalton/passport-api-docs
- sidorares. (n.d.). *node-mysql2 documentation [Official Documentation]. GitHub Pages.* https://sidorares.github.io/node-mysql2/docs
- Helmet. (n.d.). *Helmet Reference [Official Documentation].* https://helmetjs.github.io/
- Google. (2025). *Google Icons [Icons]. Google Fonts.* https://fonts.google.com/icons
- Coyier, C. (2024). *Creating an Auto-Closing Notification with an HTML Popover [Blog post]. CSS-Tricks.* https://css-tricks.com/creating-an-auto-closing-notification-with-an-html-popover/
- apvarun. (2022). *toastify-js [Library Documentation]. GitHub.* https://github.com/apvarun/toastify-js/
