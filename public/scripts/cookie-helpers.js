function getCookie(attrName) {
  if (!document.cookie) return undefined;

  if (document.cookie.match(attrName)) {
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
    return document.cookie
      .split("; ")
      .find((kv) => kv.startsWith(attrName + "="))
      ?.split("=")[1];
  }
}

export { getCookie };
