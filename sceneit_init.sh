#!/bin/bash

# If .env file exists, read variables from it
if [ -f ".env" ]; then
  echo "📋 Reading existing configuration from .env file..."
  source .env
  echo "Current environment variables:"
  echo "DB_HOST: $DB_HOST"
  echo "DB_PORT: $DB_PORT"
  echo "DB_USER: $DB_USER"
  echo "DB_NAME: $DB_NAME"
  echo "DB_PASSWORD: ${DB_PASSWORD:0:3}*****"  # Only show first 3 characters for security
fi

# Set database connection details
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

SQL_FILE="database/init.sql"

# run npm install (while supressing warning/errors during installation - the summary info printed is enough)
echo "🎬 Installing npm packages"
npm i 2> /dev/null

# Skip user creation SQL file generation and execution since user management is not allowed on Northflank
echo "🔧 Skipping database user creation steps as user management is handled by Northflank."

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file not found: $SQL_FILE"
  exit 1
fi

# Skip starting MySQL service since database is remote
echo "🔧 Skipping local MySQL service start; using remote database at $DB_HOST:$DB_PORT."

# Run the SQL script on remote database
echo "🚀 Initialising database '$DB_NAME' on remote host $DB_HOST:$DB_PORT..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "✅ Database initialised successfully: $DB_NAME"
else
  echo "❌ Database initialisation failed. Please check your credentials and SQL file."
fi

# load the movies from the TMDB API
echo "🎬 Initializing database content..."
node ./common/db_init.js || { echo "Failed to load movie info"; exit 1; }