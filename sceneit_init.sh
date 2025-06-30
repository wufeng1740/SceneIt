#!/bin/bash

# If .env file exists, read variables from it
if [ -f ".env" ]; then
  echo "📋 Reading existing configuration from .env file..."
  source .env
  echo "Current environment variables:"
  echo "DB_USER: $DB_USER"
  echo "DB_NAME: $DB_NAME"
  echo "DB_PASSWORD: ${DB_PASSWORD:0:3}*****"  # Only show first 3 characters for security
fi

# Set database username and password (modify as needed)
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

USER_SQL_FILE="database/create_user.sql"
SQL_FILE="database/init.sql"

# run npm install (while supressing warning/errors during installation - the summary info printed is enough)
echo "🎬 Installing npm packages"
npm i 2> /dev/null

# set user and password file
echo "🔧 Generating SQL for creating DB user..."
cat > $USER_SQL_FILE <<EOF
DROP USER IF EXISTS '$DB_USER'@'localhost';
DROP USER IF EXISTS '$DB_USER'@'127.0.0.1';
DROP USER IF EXISTS '$DB_USER'@'%';
FLUSH PRIVILEGES;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file not found: $SQL_FILE"
  exit 1
fi

# Start MySQL service
echo "🔧 Starting MySQL service..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  brew services start mysql
else
  service mysql start
fi

# Run user creation SQL
echo "👤 Creating database user '$DB_USER'..."
mysql -u root < $USER_SQL_FILE

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "✅ Database username set successfully: username: $DB_USER ; password: $DB_PASSWORD"
else
  echo "❌ Database initialisation failed. Please check your credentials and SQL file."
fi

# Run the SQL script
echo "🚀 Initialising database '$DB_NAME'..."
mysql -u root < $SQL_FILE

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "✅ Database initialised successfully: $DB_NAME"
else
  echo "❌ Database initialisation failed. Please check your credentials and SQL file."
fi

# load the movies from the TMDB API
echo "🎬 Init database..."
node ./common/db_init.js || { echo "Failed to load movie info"; exit 1; }

rm -f $USER_SQL_FILE