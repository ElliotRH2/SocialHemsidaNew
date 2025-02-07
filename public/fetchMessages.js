function displayMessages(messages) {
    const container = document.getElementById("messagesContainer")
    container.innerHTML = ""

    messages.reverse().forEach(function(msg) {
        const messageDiv = document.createElement("div")
        messageDiv.className = "message"

        const messageDivHeader = document.createElement("div")
        messageDivHeader.className = "messageHeader"
        messageDiv.appendChild(messageDivHeader)
    
        const messageContent = document.createElement("p")
        const messageMsg = document.createElement("p")
        messageContent.innerHTML = `<strong>Post by ${msg.username}`
        //messageContent.innerHTML = `<strong>Posted by ${msg.username}<br></strong> ${msg.message}`
        messageMsg.innerHTML = `${msg.message}`
        messageDivHeader.appendChild(messageContent)
        messageDiv.appendChild(messageMsg)

        const messageImage = document.createElement("img")
        messageImage.src = msg.imageLink

        // If the image link provided isnt loading a valid img, dont display the img element
        messageImage.onerror = function() {
            messageImage.style.display = "none"
        }
        messageImage.style.width = "50%"
        messageImage.style.height = "50%"
        messageDiv.appendChild(messageImage)

        const line = document.createElement("hr")
        line.style.width = "100%"
        line.style.height = "1px"
        line.style.backgroundColor = "rgb(40,43,70)"
        line.style.border = "none"

        messageDiv.appendChild(line)
        
        const timestamp = document.createElement("p")
        timestamp.className = "timestamp"
        timestamp.innerHTML = `<strong>Date posted:</strong> ${new Date(msg.date).toLocaleString()}`
        timestamp.style.fontSize = "13px"
        messageDiv.appendChild(timestamp)

        const lineBreak = document.createElement("hr")
        lineBreak.className = "lineBreak"
        messageDiv.appendChild(lineBreak)

        // Add potential comments
        if (Array.isArray(msg.comments) && msg.comments.length > 0) {
            console.log("found comment(s)")

            let commentCount = msg.comments.length
            const titleComment = document.createElement("p")
            titleComment.innerHTML = "Comments: " + commentCount
            messageDiv.appendChild(titleComment)

            const commentDisplayDiv = document.createElement("div")
            commentDisplayDiv.className = "commentDisplayDiv"

            // Loop through all the comments and display them
            msg.comments.forEach(function(comment) {
                const userCommentDiv = document.createElement("div")
                userCommentDiv.className = "userComment"

                const commentUser = document.createElement("p")
                commentUser.innerHTML = `<strong>@${comment.user}</strong>`

                const commentMessageP = document.createElement("p")
                commentMessageP.innerHTML = comment.commentMessage
                commentMessageP.style.fontSize = "15px"

                const timestampComment = document.createElement("p")
                timestampComment.className = "timestamp"
                timestampComment.innerHTML = `<strong>Date posted:</strong> ${new Date(comment.date).toLocaleString()}`
                timestampComment.style.fontSize = "10px"

                userCommentDiv.appendChild(commentUser)
                userCommentDiv.appendChild(commentMessageP)
                userCommentDiv.appendChild(timestampComment)
                commentDisplayDiv.appendChild(userCommentDiv)
            });

            messageDiv.appendChild(commentDisplayDiv)
        }

        // Html elements to add comments on each post
        const commentDiv = document.createElement("div")
        commentDiv.className = "messageComment"

        const commentForm = document.createElement("form")
        commentForm.setAttribute("action", "/forumPostComment")
        commentForm.setAttribute("method", "POST")
        commentDiv.appendChild(commentForm)

        const commentInputMsg = document.createElement("input")
        const commentIdInput = document.createElement("input")
        commentIdInput.className = "commentInput"
        //const commentInputImg = document.createElement("input")
        //commentInputImg.className = "commentInput"
        commentInputMsg.className = "commentInput"
        commentInputMsg.placeholder = "Add comment"
        //commentInputImg.placeholder = "Image link [optional]"
        commentIdInput.setAttribute("type", "hidden")
        commentIdInput.value = msg.id

        commentInputMsg.setAttribute("type", "text")
        commentInputMsg.setAttribute("id", "forumMessageComment")
        commentInputMsg.setAttribute("name", "forumMessageComment")
        commentInputMsg.setAttribute("required", "")
        
        /*
        commentInputImg.setAttribute("type", "text")
        commentInputImg.setAttribute("id", "forumCommentImg")
        commentInputImg.setAttribute("name", "forumCommentImg")
        commentInputImg.setAttribute("required", "")
        */

        commentIdInput.setAttribute("type", "text")
        commentIdInput.readOnly = true
        commentIdInput.setAttribute("id", "postId")
        commentIdInput.setAttribute("name", "postId")

        const submitComment = document.createElement("button")
        submitComment.setAttribute("type", "submit")
        submitComment.innerHTML = "Submit"
        submitComment.className = "commentBtn"

        commentIdInput.style.display = "none"

        messageDiv.appendChild(commentDiv)
        //commentDiv.appendChild(commentInputImg)
        commentForm.appendChild(commentInputMsg)
        commentForm.appendChild(commentIdInput)
        commentForm.appendChild(submitComment)

        container.appendChild(messageDiv)
    });
}

// Fetch messages when the page loads
window.onload = function() {
    fetch("/getMessages")
        .then(response => response.json())
        .then(data => {
            displayMessages(data)  // Display the fetched messages
        })
        .catch(error => {
            console.error("Error loading messages:", error)
        })
}