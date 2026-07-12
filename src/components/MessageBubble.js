import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../config/constants';
import { formatMessageTime, getMessageStatus } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function MessageBubble({ message, isOwn, showTimestamp }) {
  const { user } = useAuth();
  const status = isOwn ? getMessageStatus(message, user._id) : null;

  return (
    <View style={styles.wrapper}>
      {/* Date separator */}
      {showTimestamp && (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>
            {new Date(message.createdAt).toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.dateLine} />
        </View>
      )}

      <View
        style={[
          styles.bubbleRow,
          isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.textOwn : styles.textOther,
            ]}
            selectable
          >
            {message.content}
          </Text>

          <View
            style={[
              styles.bubbleFooter,
              isOwn ? styles.footerOwn : styles.footerOther,
            ]}
          >
            <Text
              style={[
                styles.timeText,
                isOwn ? styles.timeOwn : styles.timeOther,
              ]}
            >
              {formatMessageTime(message.createdAt)}
            </Text>

            {/* Status indicators for own messages */}
            {status && (
              <Text
                style={[
                  styles.statusText,
                  status === 'read'
                    ? styles.statusRead
                    : status === 'delivered'
                    ? styles.statusDelivered
                    : styles.statusSent,
                ]}
              >
                {status === 'read' ? ' ✓✓' : status === 'delivered' ? ' ✓✓' : ' ✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  dateText: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusLg,
  },
  bubbleOwn: {
    backgroundColor: COLORS.sentBubble,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: COLORS.receivedBubble,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: SIZES.md,
    lineHeight: 20,
  },
  textOwn: {
    color: COLORS.sentText,
  },
  textOther: {
    color: COLORS.receivedText,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerOwn: {
    justifyContent: 'flex-end',
  },
  footerOther: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  timeOwn: {
    color: 'rgba(13, 17, 23, 0.5)',
  },
  timeOther: {
    color: COLORS.textMuted,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 12,
    marginLeft: 2,
  },
  statusSent: {
    color: 'rgba(13, 17, 23, 0.4)',
  },
  statusDelivered: {
    color: 'rgba(13, 17, 23, 0.5)',
  },
  statusRead: {
    color: COLORS.primaryDark,
  },
});