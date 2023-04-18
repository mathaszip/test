const form = document.getElementById("myForm"); // Replace 'myForm' with the id of your form
const message = document.getElementById("message");

form.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(form); // Get the form data

    const userData = {
        username: formData.get('username').toLowerCase(), // Replace 'username' with the name of your username input field
        email: formData.get('email').toLowerCase(),
        birthday: formData.get('birthday'),
        password: formData.get('password'), // Replace 'password' with the name of your password input field
        confirmPassword: formData.get('confirmPassword')
    };

    if (!userData.username) {
        message.innerText = 'Error: Please enter a username';
        return;
    }

    if (!userData.email) {
        message.innerText = 'Error: Please enter a email';
        return;
    }

    if (userData.password !== userData.confirmPassword) {
        message.innerText = 'Error: Password doesnt match';
        return;
    }
    
    if (!userData.password) {
        message.innerText = 'Error: Please enter a password';
        return;
    }

    if (userData.password.length < 6) {
        message.innerText = 'Error: Password must be at least 6 characters long';
        return;
    }

    console.log(userData);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    };

    fetch('/importUser', options)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        message.innerText = `Error: ${data.error}`;
      } else if (data.success) {
        message.innerText = 'User created successfully, redirecting...';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000); // 2000 milliseconds = 2 seconds
      } else {
        message.innerText = 'Error: Unknown response from server';
      }
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
      message.innerText = 'Error: Network error.';
    });
});