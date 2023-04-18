// Fetch session data from the server
fetch('/session')
    .then(response => response.json())
    .then(user => {
        // Set the username in the h2 element
        const usernameElement = document.getElementById('username');
        usernameElement.textContent = `Hello, ${user.username}!`;
    })
    .catch(error => console.error('Failed to fetch session data:', error));