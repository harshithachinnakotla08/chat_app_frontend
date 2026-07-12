/*
 * IMPORTANT: Replace these URLs with your deployed backend URL
 * when building the APK for production.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.103:5000'; // e.g. https://chat-backend.onrender.com
export const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.103:5000';    // same as API_BASE_URL

export const COLORS = {
  background: '#0d1117',
  surface: '#161b22',
  surfaceHover: '#1c2333',
  primary: '#00d4aa',
  primaryDark: '#00a885',
  primaryLight: '#33ffd4',
  text: '#e6edf3',
  textSecondary: '#7d8590',
  textMuted: '#484f58',
  border: '#30363d',
  danger: '#f85149',
  dangerBg: 'rgba(248, 81, 73, 0.15)',
  sentBubble: '#00d4aa',
  sentText: '#0d1117',
  receivedBubble: '#21262d',
  receivedText: '#e6edf3',
  online: '#3fb950',
  offline: '#484f58',
  inputBg: '#0d1117',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
  radius: 12,
  radiusSm: 8,
  radiusLg: 20,
  avatar: 48,
  avatarSm: 36,
  icon: 24,
};