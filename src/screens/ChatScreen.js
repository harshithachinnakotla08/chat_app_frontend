import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { COLORS, SIZES } from '../config/constants';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';

export default function ChatScreen() {
  const route = useRoute();
  const { userId: otherUserId, username: otherUsername } = route.params;
  const { user } = useAuth();
  const { on, off, emit, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(route.params?.online || false);
  const [pageInfo, setPageInfo] = useState({ hasMore: true });

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /* Fetch chat history */
  const fetchMessages = useCallback(async (before = null) => {
    try {
      const params = { limit: 50 };
      if (before) params.before = before;

      const res = await api.get(`/api/chat/messages/${otherUserId}`, { params });
      const newMessages = res.data.data.messages || [];

      setMessages((prev) => (before ? [...newMessages, ...prev] : newMessages));
      setPageInfo({
        hasMore: newMessages.length >= 50,
        oldestDate: newMessages.length > 0 ? newMessages[0].createdAt : null,
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err.message);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchMessages();

    /* Emit read receipt when opening chat */
    setTimeout(() => {
      emit('messagesRead', { senderId: otherUserId });
    }, 500);
  }, [fetchMessages, emit, otherUserId]);

  /* Socket listeners */
  useEffect(() => {
    const handleNewMessage = (message) => {
      const senderId = message.sender._id || message.sender;
      const recipientId = message.recipient._id || message.recipient;

      /* Only process messages relevant to this chat */
      if (
        (senderId === otherUserId && recipientId === user._id) ||
        (senderId === user._id && recipientId === otherUserId)
      ) {
        setMessages((prev) => {
          /* Avoid duplicates */
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        /* Mark as read if message is from the other user */
        if (senderId === otherUserId) {
          emit('messagesRead', { senderId: otherUserId });
        }

        /* Scroll to bottom */
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    const handleDelivered = ({ messageId, deliveredAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, delivered: true, deliveredAt } : m
        )
      );
    };

    const handleReadReceipt = ({ recipientId, readAt }) => {
      if (recipientId === otherUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === user._id ? { ...m, read: true, readAt } : m
          )
        );
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId === otherUserId) {
        setIsTyping(true);
        /* Auto-dismiss after 3s if no stopTyping event */
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleStopTyping = ({ userId }) => {
      if (userId === otherUserId) {
        setIsTyping(false);
        clearTimeout(typingTimeoutRef.current);
      }
    };

    const handleStatusChange = ({ userId, online }) => {
      if (userId === otherUserId) {
        setOtherUserOnline(online);
      }
    };

    on('newMessage', handleNewMessage);
    on('messageDelivered', handleDelivered);
    on('messagesReadReceipt', handleReadReceipt);
    on('userTyping', handleTyping);
    on('userStoppedTyping', handleStopTyping);
    on('userStatusChanged', handleStatusChange);

    return () => {
      off('newMessage');
      off('messageDelivered');
      off('messagesReadReceipt');
      off('userTyping');
      off('userStoppedTyping');
      off('userStatusChanged');
      clearTimeout(typingTimeoutRef.current);
    };
  }, [on, off, emit, otherUserId, user._id]);

  /* Send message */
  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    /* Stop typing indicator */
    emit('stopTyping', { recipientId: otherUserId });
    clearTimeout(typingTimeoutRef.current);

    /* Optimistic: add message to list immediately */
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      sender: user._id,
      recipient: otherUserId,
      content: text,
      delivered: false,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    /* Send via socket */
    emit(
      'sendMessage',
      { recipientId: otherUserId, content: text },
      (response) => {
        setSending(false);
        if (response?.success) {
          /* Replace temp message with real one from server */
          setMessages((prev) =>
            prev.map((m) => (m._id === tempMessage._id ? response.data : m))
          );
        } else {
          /* Remove temp message on failure */
          setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
          setInputText(text); // Restore text
        }
      }
    );
  };

  /* Handle typing */
  const handleInputChange = (text) => {
    setInputText(text);

    if (text.trim().length > 0) {
      emit('typing', { recipientId: otherUserId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emit('stopTyping', { recipientId: otherUserId });
      }, 2000);
    } else {
      emit('stopTyping', { recipientId: otherUserId });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  /* Load older messages */
  const loadMore = () => {
    if (pageInfo.hasMore && !loading && pageInfo.oldestDate) {
      fetchMessages(pageInfo.oldestDate);
    }
  };

  /* Render message */
  const renderMessage = ({ item, index }) => (
    <MessageBubble
      message={item}
      isOwn={item.sender === user._id || item.sender?._id === user._id}
      showTimestamp={
        index === 0 ||
        new Date(messages[index - 1].createdAt).toDateString() !==
          new Date(item.createdAt).toDateString()
      }
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Online status bar under nav header */}
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, otherUserOnline ? styles.statusOnline : styles.statusOffline]} />
        <Text style={styles.statusText}>
          {otherUserOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          inverted={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <TypingIndicator />
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={2000}
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.sentText} />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Connection warning */}
      {!isConnected && (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>Reconnecting...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: COLORS.online,
  },
  statusOffline: {
    backgroundColor: COLORS.offline,
  },
  statusText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: SIZES.lg,
    color: COLORS.textMuted,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 20,
    color: COLORS.sentText,
    fontWeight: '700',
    marginLeft: 2,
  },
  connectionWarning: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 81, 73, 0.9)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  connectionWarningText: {
    color: '#fff',
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
});