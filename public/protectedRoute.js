fetch('/API/protectedRoute')
.then(response => {
if (response.status === 401) {
window.location.href = '/login';
}
return response.json();
})
.then(data => {
// Handle response data
})
.catch(error => {
// Handle error
});