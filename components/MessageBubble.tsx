// components/MessageBubble.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  content: string;
  isOwnMessage: boolean;
  sentAt: string;
};

const MessageBubble: React.FC<Props> = ({ content, isOwnMessage, sentAt }) => {
  return (
    <View
      style={[
        styles.bubble,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.content}>{content}</Text>
      <Text style={styles.time}>
        {new Date(sentAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
    maxWidth: "75%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7ff",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e0e0e0",
  },
  content: {
    fontSize: 16,
    color: "#000",
  },
  time: {
    fontSize: 12,
    marginTop: 5,
    color: "#666",
    alignSelf: "flex-end",
  },
});

export default MessageBubble;