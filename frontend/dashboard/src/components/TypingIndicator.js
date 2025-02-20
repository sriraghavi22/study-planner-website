import React from "react";
import "../styles/chat.css";

function TypingIndicator({ typing }) {
  return typing ? <div style={styles.typing}>{typing}</div> : null;
}

const styles = {
  typing: {
    padding: "8px",
    fontStyle: "italic",
    color: "#555",
  },
};

export default TypingIndicator;
