import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // To get groupId from the URL
import axios from "axios"; // Import axios for API requests
import socket from "../utils/socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

import "../styles/chat.css";

function Chat() {
  const { groupId } = useParams(); // Retrieve groupId from URL
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(""); // Track the user typing
  const userEmail = localStorage.getItem("userEmail"); // Fetch email from localStorage

  useEffect(() => {
    // Fetch previous messages for the group from the backend
    const fetchMessages = async () => {
      if (groupId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/chat/${groupId}`);
          setMessages(response.data); // Set the fetched messages
        } catch (error) {
          console.error("Error fetching messages:", error.message);
        }
      }
    };

    fetchMessages();

    // Join the group when the component mounts
    if (groupId && userEmail) {
      socket.emit("joinGroup", { groupId, email: userEmail });
    }

    // Listen for incoming messages
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for reactions
    socket.on("reaction", ({ messageId, emoji }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
            : msg
        )
      );
    });

    // Listen for typing indicator and user name
    socket.on("typing", ({ isTyping, username }) => {
      if (isTyping) {
        setTypingUser(username); // Set the username typing
        setTyping(true); // Show typing indicator
      } else {
        setTyping(false); // Hide typing indicator
        setTypingUser(""); // Clear typing user name
      }
    });

    // Clean up listeners on component unmount
    return () => {
      socket.off("message");
      socket.off("reaction");
      socket.off("typing");
    };
  }, [groupId, userEmail]);

  const handleSendMessage = (message) => {
    if (message.trim() === "") return;

    if (groupId && userEmail) {
      socket.emit("message", { groupId, email: userEmail, message });
    } else {
      console.error("Group ID or User Email is missing");
    }
  };

  const handleTyping = (isTyping) => {
    if (groupId) {
      socket.emit("typing", { groupId, isTyping, username: userEmail });
    }
  };

  const handleReaction = (messageId, emoji) => {
    if (groupId && userEmail) {
      socket.emit("reaction", { groupId, messageId, emoji });
    }
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} onReact={handleReaction} />
      {typing && <TypingIndicator typing={`${typingUser} is typing...`} />}
      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
}

export default Chat;

