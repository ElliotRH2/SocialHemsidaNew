const express = require("express")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const path = require("path")

const app = express()
const PORT = 3000

const session = require("express-session");

app.use(session({
  secret: "mySuperSecretKey", 
  resave: false,
  saveUninitialized: false, 
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, 
  }
}))

// MongoDB Connection URI
const uri = "mongodb+srv://ElliotRh:cUik8d8YqUQiNO5u@socialwebsite.uk78u.mongodb.net/MainDB" 
const dbName = "MainDB"  

// Connect to MongoDB using Mongoose
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to MongoDB Atlas!")
})
.catch((error) => {
    console.error("Error connecting to MongoDB:", error)
})

// Define the User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  profilePicture: { 
    type: String, 
    default: "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
}  // Give a default profile pic 
})

// Create the User Model
const User = mongoose.model("User", userSchema)

const Schema = mongoose.Schema

// Define the Comment schema (used inside the forum post schema)
const commentSchema = new Schema({
    user: { type: String, required: true },
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentMessage: { type: String, required: true },
    date: { type: Date, default: Date.now },
})

// Define the Post Schema
const forumPostSchema = new Schema({
  message: { type: String, required: true },
  username: { type: String, required: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  imageLink: { type: String, default: null },
  date: { type: Date, default: Date.now },
  comments: [commentSchema], // Use the comment schema 
})

// Create the Post Model
const ForumPost = mongoose.model("ForumPost", forumPostSchema)

module.exports = ForumPost

app.use(cookieParser("cookie-key"))
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

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

// If a user is logged in
app.get("/loggedIn", (req, res) => {
    if (req.cookies.loggedIn || req.session.user) {
        res.sendFile(__dirname + "/public/loggedIn.html") // send the loggedIn html page
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
app.post("/validateUserData", async (req, res) => {
    const inputPassword = req.body.password
    const inputName = req.body.username
    const acceptTOS = req.body.acceptTOS

    if (!acceptTOS) {
        console.log(acceptTOS)
        return
    }

    try {
        // Find user by username
        const user = await User.findOne({ name: inputName })

        // Check if user exists
        if (!user) {
            return res.send("<h1>Wrong username!</h1>")
        }

        // Check if the password is correct (for testing, no hashing here)
        if (user.password === inputPassword) {
            // If username and password are correct, set a cookie and redirect to the loggedIn page
            if (req.cookies.cookie_consent === "accepted") { // Only consent
                res.cookie("loggedIn", inputName)
                console.log("Saved cookie with username")
            } else {
                 req.session.user = {inputName} // Use session if no cookies consent
                 console.log("Using session: ", inputName)
            }
            return res.redirect("/loggedIn")
        } else {
            // If password is incorrect
            return res.send("<h1>Wrong password!</h1>")
        }

    } catch (err) {
        console.error("Error during login:", err)
        return res.status(500).send("<h1>Server error</h1>")
    }
})

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register.html")
})

app.post("/register", async (req, res) => {
    const newName = req.body.username  
    const newPassword = req.body.password   
  
    try {
      // Check if the user already exists in the database
      const existingUser = await User.findOne({ name: newName })
  
      if (existingUser) {
        // If the user already exists, return an error
        return res.status(400).json({ message: "Username is already taken" })
      }
  
      // If the user doesnt exist, create a new User instance
      const newUser = new User({
        name: newName,
        password: newPassword, 
      })
  
      // Save the new user to the database
      await newUser.save()
  
      console.log(`New user created: ${newName}`)

      if (req.cookies.cookie_consent === "accepted") {
        res.cookie("loggedIn", newName) // Save the username in a cookie if cookie consent is accepted
        console.log("Saved cookie with username")
      } else {
        console.log("Saving username with session: ", newName)
        req.session.user = {newName} 
      }
      
      res.redirect("/loggedIn")  // Redirect to the loggedIn page after registration
    } catch (err) {
      console.error("Error during registration:", err)
      res.status(500).json({ message: "Server error" })
    }
  })

app.get("/deleteAcc", (req, res) => {
    res.sendFile(__dirname + "/public/deleteAcc.html")  
})

app.post("/deleteAcc", async (req, res) => {
    const deleteName = req.body.username
    const deletePassword = req.body.password

    try {
        // Find the user in the database
        const user = await User.findOne({ name: deleteName })

        // Check if the user exists and if the password matches
        if (!user || user.password !== deletePassword) {
            return res.send("<h1>Account not found or incorrect credentials.</h1>")
        }

        // Delete the user from the database
        await User.deleteOne({ name: deleteName })
        console.log(`User ${deleteName} has been deleted.`)

        // Delete all posts created by the user
        await ForumPost.deleteMany({ username: deleteName })
        console.log(`All posts by ${deleteName} have been deleted.`)

        // Remove the users comments from all posts
        await ForumPost.updateMany(
            {}, // No filter, meaning we wanna update all posts
            { $pull: { comments: { user: deleteName } } } // Remove comments where user matches using mongoDB pull operator (removes elements form array based on a condition)
        )
        console.log(`All comments by ${deleteName} have been deleted.`)

        res.clearCookie("loggedIn")
        res.redirect("/login")

    } catch (err) {
        console.error("Error during account deletion:", err)
        res.status(500).send("<h1>Server error occurred during account deletion</h1>")
    }
})

app.get("/forumPost", (req, res) => {
  const consent = req.cookies.cookie_consent 

  // If cookies are rejected, ask for consent
  if (consent !== "accepted") {
    // Show page asking for cookie consent
    res.clearCookie("cookie_consent", { path: "/" })
    res.sendFile(path.join(__dirname, "public", "cookiesRequired.html"))
    return
  }

  // If we have consent but no user cookie is set yet
  if (consent && !req.cookies.loggedIn) {
    userName = req.session.user.inputName || req.session.user.newName
    res.cookie("loggedIn", userName )
    console.log("user consent but no cookie stored, saving: ", userName)
  }

  // If cookies are accepted, allow forum post access
  res.sendFile(path.join(__dirname, "public", "forums.html"))
})

// When a user creates a new forum post
app.post("/forumPost", async (req, res) => {
    const message = req.body.forumMessage
    const username = req.cookies.loggedIn 
    const imageLink = req.body.forumMsgImage || null // set to null if image is not provided

    try {
        const user = await User.findOne({ name: username })
        const userId = user._id

        // Create a new forum post document
        const newPost = new ForumPost({
            message: message,
            username: username,
            userRef: userId,
            imageLink: imageLink,
            comments: [] // Empty array for comments initially
        })

        // Save the new post to the forum posts collection
        await newPost.save()

        // Redirect to the forum page
        res.redirect("/forumPost")

    } catch (err) {
        console.error("Error saving post:", err)
        res.status(500).send("Error saving the message")
    }
})

// To fetch messages (forum posts) from another js file
app.get("/getMessages", async (req, res) => {
    try {
        // Fetch all forum posts from the MongoDB collection
        const posts = await ForumPost.find() 

        .populate("userRef", "profilePicture") // Dynamically populate the posts to include the profile picture
        .populate("comments.userRef", "profilePicture")

        // Send the posts as a JSON response
        res.json(posts)  
    } catch (err) {
        console.error("Error fetching messages:", err)
        return res.status(500).send("Error loading messages from the database")
    }
})

// Handle comments on posts
app.post("/forumPostComment", async (req, res) => {
    const postId = req.body.postId  // Post ID to find the specific post (already set no need user input)
    const commentMessage = req.body.forumMessageComment  // The comment message
    const username = req.cookies.loggedIn  // The username from cookies

    // If no data is found
    if (!postId || !commentMessage || !username) {
        return res.status(400).send("No data found")
    }

    console.log(postId, commentMessage, username)
    
    try {
        const user = await User.findOne({ name: username })
        const userId = user._id

        // Find the post by its ID in MongoDB by comparing it with the id already given on each post
        const post = await ForumPost.findOne({ _id: postId })

        if (!post) {
            return res.status(404).send("Post not found")
        }

        // Add the comment to the comments array inside the post
        post.comments.push({
            user: username,
            userRef: userId,
            commentMessage: commentMessage,
            date: new Date().toISOString()
        })

        // Save the updated post back to MongoDB
        await post.save()

        // Redirect to the forum page or send a success response
        res.redirect("/forumPost")
    } catch (err) {
        console.error("Error saving comment:", err)
        res.status(500).send("Error saving the comment")
    }
})

app.get("/profile", (req, res) => {
    res.sendFile(__dirname + "/public/profile.html")
})

app.post("/updateProfile", async (req, res) => {
    const imageLink = req.body.profilePicture || null
    const userName = req.cookies.loggedIn

    try {
        await User.updateOne(
            { name: userName },
            { $set: { profilePicture: imageLink } }
        )

        res.redirect("/profile")
 
    } catch(err) {
        console.error("Error updating profile pic", err)
    }
})

app.get("/getUserData", async (req, res) => {
    const userName = req.cookies.loggedIn

    try {
        // Find the user in MongoDB by their name
        const user = await User.findOne({ name: userName })

        if (user) {
            res.json({ 
                success: true, 
                username: user.name, 
                profilePicture: user.profilePicture 
            })
        } else {
            res.status(404).json({ success: false, message: "User not found" })
        }
    } catch (error) {
        console.error("Error fetching user data:", error)
        res.status(500).json({ success: false, message: "Server error" })
    }
})


app.get("/promptCookies", (req, res) => {
    res.clearCookie("cookie_consent", { path: "/" })
    res.sendFile(path.join(__dirname, "public", "cookiesRequired.html"))
})

app.get("/terms", (req, res) => {
    res.sendFile(__dirname + "/public/TOS.html")
})

app.get("/privacy", (req, res) => {
    res.sendFile(__dirname + "/public/privacy.html")
})



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})