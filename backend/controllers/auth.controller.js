const db = require("../common/db.js");
const argon2 = require("argon2");

async function getUser(username) {
  const getUserSql = `
    SELECT
      user_id,
      username,
      password,
      date_of_birth,
      email
    FROM
      users
    WHERE
      username = ?`;

  // Could also check by email but let's see what we'll store in the session cookie
  const results = await db.query(getUserSql, [username]);
  let user;

  if (results) {
    user = results[0];
  }

  // Would be nice to have a common frontend/backend schema
  return user;
}

async function createUser(username, password, dob, email) {
  // First check if the user exists, then try create
  const existingUser = await getUser(username);

  // Throw an error and let the route handle it
  if (existingUser) {
    const errMsg = `The username '${existingUser.username}' is not available.`;
    throw Error(errMsg);
  }

  // No duplicate user - we're good to go
  const insertUserSQL = `
    INSERT INTO
      users (username, password, date_of_birth, email, isAdmin, created_at)
    VALUES
      (?, ?, ?, ?, FALSE, NOW())`;

  await db.query(insertUserSQL, [username, password, dob, email]);

  // Could just be optimistic but let's make sure
  const user = await getUser(username);

  if (!user) {
    throw Error("An unknown error occurred when trying to create a new user.");
  }

  return user;
}


async function verifyUser(username, password, done) {

  // Fetch the user (including the hashed password)
  const user = await getUser(username);
  let errorMsg = "Incorrect username or password";

  // No user find - return an error via the callback - this is passport
  if (user) {
    // Verify the password
    try {
      if (await argon2.verify(user.password, password)) {
        // Login successful
        return done(null, user);
      }
    } catch (err) {
      errorMsg += err;
    }
  }

  // If we reach here then we couldn't log in
  return done(null, false, { message: errorMsg });
}

module.exports = {
  createUser,
  verifyUser,
  getUser,
};
