#!/bin/bash

# start the mysql server
echo "🎬 Starting the MySQL server"
service mysql start;

# config
DB_NAME="SceneIt"
DB_USER="root"

# input password
read -sp "Enter MySQL password for user '$DB_USER': " DB_PASSWORD
echo

# run sql file
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < ./backend/database/test_data.sql

# check if the command was successful
if [ $? -eq 0 ]; then
  echo "✅ test_data.sql executed successfully in database '$DB_NAME'."
else
  echo "❌ Failed to execute test_data.sql."
fi