const express = require("express")
const cookieParser = require("cookie-parser")
const app = express()
const PORT = 3000
const path = require("path")
const fs = require("fs")

// File paths for json files
const UsersFilePath = path.join(__dirname, "users.json")
const MessagesFilePath = path.join(__dirname, "messages.json")

function loadUsers() {
    try {
        const data = fs.readFileSync(UsersFilePath, "utf8")
        return JSON.parse(data) 
    } catch (err) {
        return []  
    }
}

function saveUsers(users) {
    const data = JSON.stringify(users, null, 2)  
    fs.writeFileSync(UsersFilePath, data, "utf8")
}

// Parsed json into an arary of users
let users = loadUsers()

app.use(cookieParser())
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }));

// Automatically redirect to login route
app.get("/", (req, res) => {
    res.redirect("/login")
})

// Checks if user has cookies and redicret them to loggedIn route, if not then send the login html page
app.get("/login", (req, res) => {
    if (req.cookies.loggedIn) {
        res.redirect("/loggedIn")
        return
    }

    res.sendFile(__dirname + "/public/login.html")
})

/*
app.get("/loginUser", (req, res) => {
    res.cookie("loggedIn", "true")
    res.redirect("/loggedIn")
})
*/

// If a user is logged in, greet them with their cookies username
app.get("/loggedIn", (req, res) => {
    if (req.cookies.loggedIn) {
        res.sendFile(__dirname + "/public/loggedIn.html") // If we wanna use a loggedIn html page
        const username = req.cookies.loggedIn
    } else {
        res.redirect("/login")
    }
})

// Clear cookies when a user logs out
app.get("/logout", (req, res) => {
    res.clearCookie("loggedIn")
    res.redirect("/login")
})

// When a user tries to log in, validate to check if theres an account matching their details
app.post("/validateUserData", (req, res) => {
    const inputPassword = req.body.password;
    const inputName = req.body.username;

    console.log("Entered password:", inputPassword);
    console.log("Entered Name:", inputName);

    let userFound = false;  
    let passwordCorrect = false;  

    for (let index = 0; index < users.length; index++) {
        if (users[index].name === inputName) {
            userFound = true;
            if (users[index].password === inputPassword) {
                passwordCorrect = true;
                res.cookie("loggedIn", inputName);
                return res.redirect("/loggedIn");  
            } else {
                return res.send("<h1>Wrong password!</h1>");
            }
        }
    }

    if (userFound && !passwordCorrect) {
        return res.send("<h1>Wrong password!</h1>");
    }

    if (!userFound) {
        return res.send("<h1>Wrong username!</h1>");
    }

    res.send("<h1>Wrong username and password!</h1>");
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register.html")  
})

// When a user creates a new account
app.post("/register", (req, res) => {
    const newName = req.body.username
    const newPassword = req.body.password

    for (let index = 0; index < users.length; index++) {
        if (users[index].name === newName)
        {
            return res.send("<h1>Username already taken. Try a different one.</h1>")
        }
    }

    users.push({ name: newName, password: newPassword }) // Push new data to users array
    console.log(`New user created: ${newName}`)

    saveUsers(users) // Save new user data in json
    res.cookie("loggedIn", newName) // Save username in a cookie
    res.redirect("/loggedIn")
})

app.get("/deleteAcc", (req, res) => {
    res.sendFile(__dirname + "/public/deleteAcc.html")  
})

app.post("/deleteAcc", (req, res) => {
    const deleteName = req.body.username
    const deletePassword = req.body.password

    const initialUserCount = users.length

    const updatedUsers = users.filter(user => 
        !(user.name === deleteName && user.password === deletePassword)
    )

    if (updatedUsers.length === initialUserCount) {
        return res.send("<h1>Account not found or incorrect credentials.</h1>")
    }

    // Save and load users after deleting account
    saveUsers(updatedUsers)
    users = loadUsers()

    // Delete all the users forum posts
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.send("Error saving the message.");
        }   

        let usernameToDelete = req.cookies.loggedIn || deleteName // use deleteName if the user wanna delete the account while not being logged in since then they have no cookie
        let messages = JSON.parse(data);
        messages = messages.filter(post => post.username !== usernameToDelete); // Return an array without any posts belonging to the user

        // Save the updated messages to the JSON file
        fs.writeFile(MessagesFilePath, JSON.stringify(messages, null, 2), (err) => {
            if (err) {
                console.error("Error writing file:", err);
                return res.send("Error saving the message.");
            }
        });
    });

    res.clearCookie("loggedIn")
    res.redirect("/login")
})

app.get("/forumPost", (req, res) => {
    // Read the messages from the JSON file (Not needed now)
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err)
            return res.send("Error loading messages.")
        }
        // Parse the messages
        const messages = JSON.parse(data || "[]")  // If file is empty, return an empty array
        // Render the HTML page and send the messages to the client
        res.sendFile(path.join(__dirname, "public", "forums.html"))
    });
});

app.post("/forumPost", (req, res) => {
    const message = req.body.forumMessage
    const username = req.cookies.loggedIn
    const imageLink = req.body.forumMsgImage || null // set to null if image is not provided since its optional

    // Read the existing messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err)
            return res.send("Error saving the message.")
        }   

        // Parse the current messages and add the new one
        const messages = JSON.parse(data || "[]")

        const postId = Date.now().toString()

        messages.push({
            id: postId,
            message: message,
            username: username, // Store the username with the message
            imageLink: imageLink,
            date: new Date().toISOString(),
            comments: []
        })

        // Save the updated messages to the JSON file
        fs.writeFile(MessagesFilePath, JSON.stringify(messages, null, 2), (err) => {
            if (err) {
                console.error("Error writing file:", err)
                return res.send("Error saving the message.")
            }
            // Redirect to the same page to reload the messages
            res.redirect("/forumPost")
        })
    })
})

// Messages (forum posts) will be fetched in another js file
app.get("/getMessages", (req, res) => {
    // Read the messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err)
            return res.status(500).send("Error loading messages.")
        }
        
        // Send the messages as JSON response
        const messages = JSON.parse(data || "[]")  // If file is empty, return an empty array
        res.json(messages)  // Send the messages as JSON
    })
})

app.post("/forumPostComment", (req, res) => {
    console.log("comment post triggered")
    const postId = req.body.postId
    const commentMessage = req.body.forumMessageComment
    const username = req.cookies.loggedIn
    
    //const imageLink = req.body.forumMsgImage || null // set to null if image is not provided since its optional

    // Read the existing messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err)
            return res.send("Error saving the comment.")
        }   

        // Parse the current messages and add the new one
        const messages = JSON.parse(data || "[]")
        
        const post = messages.find(msg => msg.id === postId)

        if (post) {
            // Add the comment to the comments array for the post
            post.comments.push({
                user: username,
                commentMessage: commentMessage,
                date: new Date().toISOString() 
            })

            // Save the updated messages back to the file
            fs.writeFile(MessagesFilePath, JSON.stringify(messages, null, 2), (err) => {
                if (err) {
                    console.error("Error writing file:", err)
                    return res.send("Error saving the comment.")
                }
                res.redirect("/forumPost")  // Reload the page
            })
        } else {
            res.send("Post not found for the specified user.")
        }
    })
})

app.get("/profile", (req, res) => {
    res.sendFile(__dirname + "/public/profile.html")  
})



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})