const express = require("express")
const cookieParser = require("cookie-parser")
const app = express()
const PORT = 3000
const path = require("path")
const fs = require("fs")

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

let users = loadUsers()
//console.log(users)

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

// If a user is logged in, greet them with their cookies username and offer a way to log out
app.get("/loggedIn", (req, res) => {
    if (req.cookies.loggedIn) {
        res.sendFile(__dirname + "/public/loggedIn.html") // If we wanna use a loggedIn html page
        const username = req.cookies.loggedIn
         // Redirect to logout route if clicked button
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

app.post("/register", (req, res) => {
    const newName = req.body.username
    const newPassword = req.body.password

    for (let index = 0; index < users.length; index++) {
        if (users[index].name === newName)
        {
            return res.send("<h1>Username already taken. Try a different one.</h1>")
        }
    }

    users.push({ name: newName, password: newPassword })
    console.log(`New user created: ${newName}`)

    saveUsers(users)
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

    saveUsers(updatedUsers)
    users = loadUsers()
    res.redirect("/login")
})

app.get("/forumPost", (req, res) => {
    // Read the messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.send("Error loading messages.");
        }
        // Parse the messages
        const messages = JSON.parse(data || "[]");  // If file is empty, return an empty array
        // Render the HTML page and send the messages to the client
        res.sendFile(path.join(__dirname, "public", "forums.html"));
    });
});

app.post("/forumPost", (req, res) => {
    const message = req.body.forumMessage;
    const username = req.cookies.loggedIn

    // Read the existing messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.send("Error saving the message.");
        }

        // Parse the current messages and add the new one
        const messages = JSON.parse(data || "[]");
        messages.push({
            message: message,
            username: username, // Store the username with the message
            date: new Date().toISOString()
        });

        // Save the updated messages to the JSON file
        fs.writeFile(MessagesFilePath, JSON.stringify(messages, null, 2), (err) => {
            if (err) {
                console.error("Error writing file:", err);
                return res.send("Error saving the message.");
            }
            // Redirect to the same page to reload the messages
            res.redirect("/forumPost");
        });
    });
});

app.get("/getMessages", (req, res) => {
    // Read the messages from the JSON file
    fs.readFile(MessagesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).send("Error loading messages.");
        }
        
        // Send the messages as JSON response (messages will be fetched and displayed in another js file)
        const messages = JSON.parse(data || "[]");  // If file is empty, return an empty array
        res.json(messages);  // Send the messages as JSON
    }); 
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})