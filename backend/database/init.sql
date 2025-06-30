/*
Run this code:
source ./backend/database/init.sql;
*/

-- Create Database ------------------------------------------------------------
-- create database
DROP DATABASE IF EXISTS SceneIt;
DROP USER IF EXISTS 'scene-it'@'localhost';

CREATE DATABASE SceneIt
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;


-- use database
USE SceneIt;

CREATE USER 'scene-it'@'localhost';
GRANT ALL PRIVILEGES ON SceneIt.*
    TO 'scene-it'@'localhost';
FLUSH PRIVILEGES;

-- Create Tables ------------------------------------------------------------
-- 1. Users table
CREATE TABLE users (
    user_id       INT            AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100)   NOT NULL UNIQUE,
    avatar        VARCHAR(255)   DEFAULT 'avatars/default.png',
    password      VARCHAR(255)   NOT NULL,
    date_of_birth DATE,
    address       VARCHAR(500),
    email         VARCHAR(254),
    isAdmin       BOOLEAN        DEFAULT FALSE,
    created_at    DATETIME       DEFAULT CURRENT_TIMESTAMP
);

-- 2. Movies table
CREATE TABLE movie (
    movie_id       INT            AUTO_INCREMENT PRIMARY KEY,
    movie_ext_id   VARCHAR(100)   NOT NULL,
    ext_url        VARCHAR(100),
    title          VARCHAR(255)   NOT NULL,
    release_date   DATE,
    runtime_mins   INT,
    language       VARCHAR(20),
    rating_average DECIMAL(3,1),
    rating_count   INT,
    poster_url     VARCHAR(500),
    thumbnail      VARCHAR(500),
    trailer_url    VARCHAR(500),
    updated_at     DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    synopsis       TEXT
);

-- 3. Movie tags table
CREATE TABLE movie_tag (
    movie_id INT          NOT NULL,
    tag      VARCHAR(100) NOT NULL,
    PRIMARY KEY (movie_id, tag),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE
);

-- 4. User–Movie relationship (ratings/comments)
CREATE TABLE user_movie (
    user_id   INT       NOT NULL,
    movie_id  INT       NOT NULL,
    rating    INT,
    comment   VARCHAR(500),
    update_at DATETIME  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE
);

-- 5. User-defined lists
CREATE TABLE user_list (
    list_id     INT            AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    user_id     INT            NOT NULL,
    description VARCHAR(500),
    isLock        BOOLEAN       DEFAULT FALSE,
    created_at  DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Movie–List mapping
CREATE TABLE list_movie (
    list_id   INT NOT NULL,
    movie_id  INT NOT NULL,
    added_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, movie_id),
    FOREIGN KEY (list_id)  REFERENCES user_list(list_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id) ON DELETE CASCADE
);

-- 7. User Blocked Movies table (for "don't show me again" feature)
CREATE TABLE user_blocked_movies (
    user_id      INT      NOT NULL,
    movie_ext_id VARCHAR(100) NOT NULL, -- TMDB movie ID
    blocked_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_ext_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    -- No foreign key for movie_ext_id to movie(movie_ext_id) as movies might not always be in our db
    -- or we are blocking based on TMDB ID directly.
);
