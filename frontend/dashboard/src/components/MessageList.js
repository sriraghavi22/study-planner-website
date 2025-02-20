// File: src/components/MessageList.js
import React, { useState, useEffect } from "react";
import "../styles/chat.css";

const emojiList = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉"];

function MessageList({ messages }) {
  const userEmail = localStorage.getItem("userEmail");

  return (
    <div style={styles.messageList}>
      {messages.map((msg, index) => (
        <MessageWithReaction
          key={index}
          message={msg.message}
          sender={msg.username}
          messageId={msg.id || index} // Use a unique ID for storing reactions
          alignSelf={msg.username === userEmail ? "flex-end" : "flex-start"}
          backgroundColor={msg.username === userEmail ? "#007BFF" : "#fff"}
          color={msg.username === userEmail ? "#fff" : "#000"}
        />
      ))}
    </div>
  );
}

function MessageWithReaction({ message, sender, messageId, alignSelf, backgroundColor, color }) {
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState("");

  // Load the saved reaction from localStorage
  useEffect(() => {
    const savedReaction = localStorage.getItem(`reaction-${messageId}`);
    if (savedReaction) {
      setReaction(savedReaction);
    }
  }, [messageId]);

  const toggleReactions = () => setShowReactions(!showReactions);

  const addReaction = (emoji) => {
    setReaction(emoji);
    setShowReactions(false);

    // Save the reaction to localStorage
    localStorage.setItem(`reaction-${messageId}`, emoji);
  };

  return (
    <div
      style={{
        ...styles.message,
        alignSelf,
        backgroundColor,
        color,
      }}
    >
      <strong>{sender}:</strong> {message}
      {reaction && <span className="reaction">{reaction}</span>}

      <div className="reaction-container">
        <button className="reaction-button" onClick={toggleReactions}>
          😊
        </button>
        {showReactions && (
          <div className="emoji-picker">
            {emojiList.map((emoji, index) => (
              <span
                key={index}
                className="emoji"
                onClick={() => addReaction(emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  messageList: {
    flex: 1,
    overflowY: "scroll",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    marginBottom: "8px",
    padding: "8px",
    borderRadius: "5px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    maxWidth: "60%",
  },
};

export default MessageList;