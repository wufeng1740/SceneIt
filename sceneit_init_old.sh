#!/bin/bash

# config
ENV_FILE="./.env"
SQL_INIT="./database/init.sql"
DB_ROOT_USER="root"
DB_APP_USER="scene-it"
DB_NAME="SceneIt"

# Let 'em know
echo "🎬 Setting up Scene It..."

# run npm install (while supressing warning/errors during installation - the summary info printed is enough)
echo "🎬 Installing npm packages"
cd ./backend/
npm i 2> /dev/null
cd ..

# create the .env file
echo "🎬 Creating the .env file"
if [ -f "$ENV_FILE" ]; then
  echo "🎬 .env file already exists... not anymoreeeee 😬"
fi

# Code Attribution: Shell command to securely create a random string
# Source: https://unix.stackexchange.com/a/306107
# Author: Martin Vegter
secret=`openssl rand -hex 16`
echo "SESSION_SECRET=$secret" > "$ENV_FILE"

# Add db app user to the environment file
echo "DB_USER=$DB_APP_USER" >> "$ENV_FILE"

# start the mysql server
echo "🎬 Starting the MySQL server"
service mysql start;

# now run the init script to create the db
echo "🎬 Initialising the $DB_NAME database using $SQL_INIT..."
mysql -u $DB_ROOT_USER < "$SQL_INIT"
sleep 5;
echo "🎬 Database $DB_NAME created"

# create the user for the app
# we actually don't need to ask for the app user password
# set it using the same method as the session secret above
app_user_pw=`openssl rand -hex 16`
echo "🎬 Automatically setting a password for the database-level app user"
echo "DB_PASSWORD=$app_user_pw" >> "$ENV_FILE"

# TMBD API key
# read -p "🎬 Enter your TMDB Access Token: " access_token
# echo "TMDB_API_ACCESS_TOKEN=$access_token" >> "$ENV_FILE"
echo "ALTER USER '$DB_APP_USER'@'localhost' IDENTIFIED BY '$app_user_pw';" | mysql -u $DB_ROOT_USER

# load the movies from the TMDB API
echo "🎬 Loading movie info..."
node ./backend/common/db_init.js || { echo "Failed to load movie info"; exit 1; }

