async function sceneitRequest(url, method, requestData) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Add this line to send cookies
  };
  if (requestData) options.body = JSON.stringify(requestData);

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMsg = `Request to ${url} failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // If response is not JSON or error parsing, stick with the status message
    }
    throw new Error(errorMsg);
  }

  // Handle cases where response might be empty for 200/201/204 but still successful
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return { success: true, message: "Operation successful." }; // Or simply return {};
  }
  return await response.json(); // For responses that do return JSON
}

export { sceneitRequest };