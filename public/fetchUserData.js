function loadProfilePicture() {
    fetchProfileData() // Fetch data here too to get the most recent saved profile pic which is stored in the user
    const savedUser = localStorage.getItem("user") // Get from localStorage
    const user = JSON.parse(savedUser)

    if (user && user.username == usernameFromCookie) { // We save the username belonging to the profile picture, so we can check if the cookie with their username is matching to only display it on the right account
        savedPic = user.profilePicture
        document.getElementById("profilePic").src = savedPic
        console.log("found pfp in local storage")
    } else {
        // Otherwise, fetch it from the server
        console.log("no local pfp found, fetching it")
        fetchProfileData()
    }
}

async function fetchProfileData() {
    try {
        const response = await fetch("/getUserData")
        const data = await response.json()

        if (data.success) {
            // Save the user data in localStorage
            console.log("data success")
            const user = {
                username: data.username,
                profilePicture: data.profilePicture 
            }
            console.log(user)
            localStorage.setItem("user", JSON.stringify(user))

            // Display the profile pic
            document.getElementById("profilePic").src = user.profilePicture
        } else {
            console.error("Profile data not found or user not logged in.")
        }
    } catch (error) {
        console.error("Error fetching profile data:", error)
    }
}

// Function to get a specific cookie value by name
function getCookie(name) {
    const cookies = document.cookie.split(" ")
    for (let cookie of cookies) {
      const [key, value] = cookie.split("=")
      if (key === name) {
        return decodeURIComponent(value) // Decode to handle special characters
      }
    }
    return null // If cookie is not found
  }
  
  // Get the username from the loggedIn cookie
  const usernameFromCookie = getCookie("loggedIn")

loadProfilePicture()