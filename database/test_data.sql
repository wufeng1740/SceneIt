/*
Run this code:
source ./backend/database/test_data.sql;
*/

-- clean data
SET FOREIGN_KEY_CHECKS = 0;

/* clean data and reset id number*/
TRUNCATE TABLE list_movie;
TRUNCATE TABLE user_movie;
TRUNCATE TABLE movie_tag;
TRUNCATE TABLE user_list;
TRUNCATE TABLE movie;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. users
INSERT INTO users (username, avatar, password, date_of_birth, address, email, isAdmin)
VALUES
  ('admin',    'img/logo_light-mode.png','admin',   '1991-04-14', '123 Main St',        'alice@example.com',  TRUE),
  ('alice',    '/avatars/default.png',   'pass123', '1990-01-01', '123 Main St',        'alice@example.com',  FALSE),
  ('bob',      '/avatars/default.png',   'pass123', '1985-05-12', '456 Oak Ave',        'bob@example.com',    FALSE),
  ('carol',    '/avatars/default.png',   'pass123', '1978-09-30', '789 Pine Rd',        'carol@example.com',  FALSE),
  ('david',    '/avatars/default.png',   'pass123', '1992-11-20', '321 Cedar Blvd',     'david@example.com',  FALSE),
  ('emma',     '/avatars/default.png',   'pass123', '1988-07-15', '654 Spruce Ln',      'emma@example.com',   FALSE),
  ('frank',    '/avatars/default.png',   'pass123', '1995-03-05', '987 Birch Dr',       'frank@example.com',  FALSE),
  ('grace',    '/avatars/default.png',   'pass123', '1982-12-10', '159 Elm St',         'grace@example.com',  FALSE),
  ('henry',    '/avatars/default.png',   'pass123', '1991-04-22', '753 Willow Way',     'henry@example.com',  FALSE),
  ('irene',    '/avatars/default.png',   'pass123', '1987-08-18', '852 Cherry Cir',     'irene@example.com',  FALSE),
  ('jack',     '/avatars/default.png',   'pass123', '1993-02-27', '951 Maple Crest',    'jack@example.com',   FALSE);

-- -- 2. movie
-- INSERT INTO movie (movie_ext_id, ext_url, title, release_date, runtime_mins, language, rating_average, rating_count, poster_url, thumbnail, trailer_url, synopsis)
-- VALUES
--   ('ext001','https://api.example.com/m/1','The First Movie', '2001-01-01', 120, 'English', 7.5, 1200, '/posters/1.png','/thumbs/1.jpg','/trailers/1.mp4','Synopsis 1'),
--   ('ext002','https://api.example.com/m/2','Second Film',    '2002-02-02',  95, 'English', 6.8,  850, '/posters/2.png','/thumbs/2.jpg','/trailers/2.mp4','Synopsis 2'),
--   ('ext003','https://api.example.com/m/3','Third Feature',  '2003-03-03', 105, 'French',  8.2,  430, '/posters/3.png','/thumbs/3.jpg','/trailers/3.mp4','Synopsis 3'),
--   ('ext004','https://api.example.com/m/4','Fourth Story',   '2004-04-04', 110, 'Spanish', 7.0,  670, '/posters/4.png','/thumbs/4.jpg','/trailers/4.mp4','Synopsis 4'),
--   ('ext005','https://api.example.com/m/5','Fifth Saga',     '2005-05-05', 130, 'English', 8.5,  980, '/posters/5.png','/thumbs/5.jpg','/trailers/5.mp4','Synopsis 5'),
--   ('ext006','https://api.example.com/m/6','Sixth Episode',  '2006-06-06',  90, 'German',  6.2,  300, '/posters/6.png','/thumbs/6.jpg','/trailers/6.mp4','Synopsis 6'),
--   ('ext007','https://api.example.com/m/7','Seventh Tale',   '2007-07-07', 115, 'English', 7.8, 1120, '/posters/7.png','/thumbs/7.jpg','/trailers/7.mp4','Synopsis 7'),
--   ('ext008','https://api.example.com/m/8','Eighth Journey', '2008-08-08', 125, 'Italian', 8.0,  560, '/posters/8.png','/thumbs/8.jpg','/trailers/8.mp4','Synopsis 8'),
--   ('ext009','https://api.example.com/m/9','Ninth Quest',    '2009-09-09', 100, 'English', 6.9,  740, '/posters/9.png','/thumbs/9.jpg','/trailers/9.mp4','Synopsis 9'),
--   ('ext010','https://api.example.com/m/10','Tenth Chronicle','2010-10-10',140, 'English', 8.7, 1350, '/posters/10.png','/thumbs/10.jpg','/trailers/10.mp4','Synopsis 10');

-- -- 3. movie_tag
-- INSERT INTO movie_tag (movie_id, tag) VALUES
--   (1,'Action'), (1,'Adventure'),
--   (2,'Drama'),  (2,'Romance'),
--   (3,'Comedy'), (3,'Family'),
--   (4,'Horror'), (4,'Thriller'),
--   (5,'Sci-Fi'), (5,'Fantasy'),
--   (6,'Documentary'),
--   (7,'Action'), (7,'Drama'),
--   (8,'Adventure'),
--   (9,'Mystery'),
--   (10,'Animation');

-- -- 4. user_movie
-- INSERT INTO user_movie (user_id, movie_id, rating, comment) VALUES
--   (1,1,0,'Great!'),    (1,2,4,'Good'),
--   (2,1,3,'So-so'),     (2,3,5,'Loved it'),
--   (3,4,2,'Not my type'),(3,5,4,'Pretty good'),
--   (4,6,3,'Average'),   (4,7,5,'Excellent'),
--   (5,8,4,'Enjoyable'), (5,9,0,'Okay'),
--   (6,10,5,'Masterpiece');

-- -- 5. user_list
-- INSERT INTO user_list (name, user_id, description) VALUES
--   ('Favorites',    1, 'My favorite movies'),
--   ('Watch Later',  1, 'To watch soon'),
--   ('Top Picks',    2, 'Best selections'),
--   ('Classics',     3, 'Old classics'),
--   ('Kids',         3, 'Family-friendly'),
--   ('Documentaries',4, 'Learn new things'),
--   ('Horror Fun',   5, 'Scary nights'),
--   ('Comedy Hits',  6, 'Laughs'),
--   ('Sci-Fi Zone',  7, 'Futuristic'),
--   ('Animations',   8, 'Animated films');

-- -- 6. list_movie
-- INSERT INTO list_movie (list_id, movie_id) VALUES
--   (1,1),(1,5),(1,7),
--   (2,2),(2,3),
--   (3,1),(3,4),
--   (4,5),(4,6),
--   (5,8),(5,9),
--   (6,10),(7,4),
--   (8,3),(9,2),
--   (10,1);
