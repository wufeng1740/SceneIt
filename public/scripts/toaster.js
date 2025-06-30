async function showToast(message, theme) {

  const themeStyles = {
    error: 'error-toaster',
    warning: 'warning-toaster',
    info: 'info-toaster',
    success: 'success-toaster',
  }

  const toastOptions = {
    className: themeStyles[theme],
    duration: 3000,
    close: true,
    gravity: "bottom", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    offset: {
      y: "4em",
    },
    stopOnFocus: true, // Prevents dismissing of toast on hover
  };

  // Show toaster
  toastOptions.text = message;
  Toastify(toastOptions).showToast();
}
