const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { addSciFiMovies } = require('./db_addMovies.js');
const { addAdminUser } = require('./db_addAdmin.js');
async function main() {
  try {
    await addSciFiMovies();
    console.log('🎉 successfully added Sci-Fi movies to the database');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    await addAdminUser();
    console.log('🎉 successfully added admin user to the database');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
