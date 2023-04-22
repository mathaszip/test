document.addEventListener("DOMContentLoaded", (e) => {
  fetch('/API/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => {
    if (response.ok) {
      document.querySelector("#message").textContent = "Logout successful, redirecting to login page. . .";
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } else {
      document.querySelector("#message").textContent = "Logout not successful";
    }
  })
  .catch(error => {
    console.error(error);
  });
});

