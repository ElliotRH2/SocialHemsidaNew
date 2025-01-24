// Function to get a specific cookie value by name
function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) {
        return decodeURIComponent(value); // Decode to handle special characters
      }
    }
    return null; // If cookie is not found
  }
  
  // Get the username from the loggedIn cookie
  const username = getCookie("loggedIn");
  
  // Display the username in HTML elements
  if (username) {
    document.getElementById("username").textContent = username;
    document.getElementById("usernameHeader").textContent = username;
  } 
  