import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { COLORS, SIZES } from '../config/constants';
import { formatTime, truncate } from '../utils/helpers';

export default function ChatListScreen() {
  const { user, logout } = useAuth();
  const { on, off, isConnected } = useSocket();
  const navigation = useNavigation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Fetch conversations from API */
  const fetchConversations = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get('/api/chat/conversations');
      setConversations(res.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load conversations';
      if (!isPullRefresh) Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* Listen for new messages and update conversation list */
  useEffect(() => {
    const handleNewMessage = (message) => {
      setConversations((prev) => {
        const otherUserId =
          message.sender._id === user._id ? message.recipient : message.sender._id;
        const otherUsername =
          message.sender._id === user._id
            ? 'Unknown'
            : message.sender.username;

        /* Remove existing conversation with this user */
        const filtered = prev.filter((c) => c._id !== otherUserId);

        /* Add updated conversation at the top */
        return [
          {
            _id: otherUserId,
            username: otherUsername,
            online: prev.find((c) => c._id === otherUserId)?.online || false,
            lastSeen: prev.find((c) => c._id === otherUserId)?.lastSeen,
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              sender: message.sender._id,
            },
            unreadCount:
              message.sender._id !== user._id
                ? (prev.find((c) => c._id === otherUserId)?.unreadCount || 0) + 1
                : 0,
          },
          ...filtered,
        ];
      });
    };

    const handleStatusChange = ({ userId, online }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === userId ? { ...c, online } : c))
      );
    };

    const handleReadReceipt = ({ recipientId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === recipientId ? { ...c, unreadCount: 0 } : c
        )
      );
    };

    on('newMessage', handleNewMessage);
    on('userStatusChanged', handleStatusChange);
    on('messagesReadReceipt', handleReadReceipt);

    return () => {
      off('newMessage');
      off('userStatusChanged');
      off('messagesReadReceipt');
    };
  }, [on, off, user._id]);

  /* Navigate to chat */
  const openChat = (conversation) => {
    /* Clear unread count locally */
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversation._id ? { ...c, unreadCount: 0 } : c
      )
    );

    navigation.navigate('Chat', {
      userId: conversation._id,
      username: conversation.username,
      online: conversation.online,
    });
  };

  /* Logout */
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  /* Render a conversation item */
  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChat(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          <Text style={styles.timestamp}>
            {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
          </Text>
        </View>

        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage
              ? `${item.lastMessage.sender === user._id ? 'You: ' : ''}${truncate(item.lastMessage.content)}`
              : 'No messages yet'}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  /* Empty state */
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a new chat from the button below
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          {/* Connection indicator */}
          <View style={[styles.statusDot, isConnected ? styles.statusDotOnline : styles.statusDotOffline]} />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchConversations(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      {/* New chat button — opens user list */}
      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          try {
            const res = await api.get('/api/chat/users');
            const users = res.data.data || [];
            if (users.length === 0) {
              Alert.alert('No Users', 'No other users registered yet.');
              return;
            }

            /* Show user picker */
            const buttons = users.map((u) => ({
              text: u.username + (u.online ? '  🟢' : ''),
              onPress: () =>
                navigation.navigate('Chat', {
                  userId: u._id,
                  username: u.username,
                  online: u.online,
                }),
            }));
            buttons.push({ text: 'Cancel', style: 'cancel' });

            Alert.alert('Start a Chat', 'Select a user:', buttons);
          } catch (err) {
            Alert.alert('Error', 'Failed to load users.');
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: COLORS.online,
  },
  statusDotOffline: {
    backgroundColor: COLORS.offline,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.dangerBg,
  },
  logoutText: {
    fontSize: SIZES.sm,
    color: COLORS.danger,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: SIZES.avatar,
    height: SIZES.avatar,
    borderRadius: SIZES.avatar / 2,
    backgroundColor: COLORS.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: SIZES.xl,
    fontWeight: '600',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.sentText,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.sentText,
    lineHeight: 36,
  },
});