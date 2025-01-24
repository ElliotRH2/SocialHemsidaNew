function displayMessages(messages) {
    const container = document.getElementById("messagesContainer");
    container.innerHTML = "";  

    messages.forEach(msg => {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message";
    
        const messageContent = document.createElement("p");
        messageContent.innerHTML = `<strong>Posted by ${msg.username}</strong> ${msg.message}`;
        messageDiv.appendChild(messageContent);

        const line = document.createElement("hr")
        line.style.width = "100%"
        line.style.height = "2px"
        line.style.backgroundColor = "Black"
        line.style.border = "none"

        messageDiv.appendChild(line)
        
        const timestamp = document.createElement("p");
        timestamp.className = "timestamp";
        timestamp.innerHTML = `<strong>Date posted:</strong> ${new Date(msg.date).toLocaleString()}`;
        messageDiv.appendChild(timestamp);
        
        container.appendChild(messageDiv);
    });
}

// Fetch messages when the page loads
window.onload = function() {
    fetch("/getMessages")
        .then(response => response.json())
        .then(data => {
            displayMessages(data);  // Display the fetched messages
        })
        .catch(error => {
            console.error("Error loading messages:", error);
        });
}