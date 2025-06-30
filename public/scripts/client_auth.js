async function login(username, password) {
  const request_data = {
    username,
    password,
  };

  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request_data),
  });

  if (!response.ok) {
    const results = await response.json();
    let errMsg = "Incorrect username or password";
    if (results.error) errMsg = results.error;
    throw new Error(errMsg);
  }

  // At this point the username cookie should be set (by the server)
  const user = await response.json();

  return user;
}
