import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Animated, TextInput, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import {
  Flame, Heart, MessageCircle, Share2, Users, UserPlus,
  Send, Compass, Sparkles, TrendingUp
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ADVENTURE_EMOJIS = ["🔥", "🏔️", "⚡", "🌊", "🎯", "💎"];

type TabType = 'feed' | 'duo' | 'squads';

export const BonfireScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const fetchFeed = async () => {
    try {
      const response = await api.get('/social/feed');
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to fetch feed', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(), fetchNearbyUsers(), fetchPendingRequests()]);
    setRefreshing(false);
  };

  const fetchNearbyUsers = async () => {
    try {
      const response = await api.get('/users/nearby');
      setNearbyUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch nearby users', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/social/requests/received');
      setPendingRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch pending requests', error);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    try {
      const response = await api.post(`/social/feed/${postId}/react`, { emoji });
      if (response.data.success) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, reactions_json: response.data.reactions } : p
        ));
      }
    } catch (error) {
      console.error('Reaction failed', error);
    }
  };

  const findPartner = async (mode: 'duo' | 'squad') => {
    setMatching(true);
    try {
      const res = await api.post('/matchmaking/join', {}, { params: { mode } });
      if (res.data.matched) {
        Alert.alert('Match Found!', `You've been paired with ${res.data.participant_ids.length - 1} other wanderers!`, [
          { text: 'Great!', onPress: () => setMatching(false) }
        ]);
      } else {
        Alert.alert('In Queue', 'We are looking for partners in your city. We will notify you when a match is found.');
      }
    } catch (err) {
      console.error('Matchmaking failed', err);
      Alert.alert('Matchmaking Error', 'Could not join the queue. Please try again.');
      setMatching(false);
    }
  };

  const sendMatchRequest = async (receiverId: string, mode: 'duo' | 'squad') => {
    try {
      await api.post('/social/requests', { receiver_id: receiverId, mode });
      Alert.alert('Request Sent', 'Wanderer notified! They can accept or reject your request.');
      fetchNearbyUsers(); // refresh list
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Could not send request');
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.post(`/social/requests/${requestId}/respond`, { status });
      fetchPendingRequests();
      if (status === 'accepted') {
        Alert.alert('Adventure Started!', 'You are now paired! Check your journal for shared quests.');
      }
    } catch (error) {
      console.error('Failed to respond to request', error);
    }
  };

  const postComment = async () => {
    if (!activePostId || !commentText.trim()) return;
    try {
      await api.post(`/social/feed/${activePostId}/comment`, { content: commentText });
      setCommentText('');
      setActivePostId(null);
      fetchFeed(); // Refresh to show comment count update
      Alert.alert('Replied!', 'Your tale continues in the replies.');
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchNearbyUsers();
    fetchPendingRequests();
  }, []);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    const toVal = tab === 'feed' ? 0 : tab === 'duo' ? 1 : 2;
    Animated.spring(tabIndicator, { toValue: toVal, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };

  const tabWidth = (width - 48) / 3;
  const translateX = tabIndicator.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const renderPost = ({ item }: { item: any }) => {
    const reactions = item.reactions_json || {};
    const totalReactions = Object.values(reactions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);
    const commentCount = item.comments?.[0]?.count || 0;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.warmGlow]}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{item.user_name?.[0] || 'W'}</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.postTime}>
              {new Date(item.shared_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.questBadge}>
            <Compass size={10} color={COLORS.accent} />
            <Text style={styles.questBadgeText}>QUEST</Text>
          </View>
        </View>

        {/* Quest Title */}
        <View style={styles.questTitleWrap}>
          <Text style={styles.questTitle}>{item.quest_title}</Text>
        </View>

        {/* Photo */}
        {item.photo_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.photo_url }} style={styles.postImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(10,22,40,0.6)']}
              style={styles.imageOverlay}
            />
          </View>
        )}

        {/* Caption */}
        {item.caption && (
          <View style={styles.captionWrap}>
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        )}

        {/* Reactions */}
        <View style={styles.reactionSection}>
          <View style={styles.reactionRow}>
            {ADVENTURE_EMOJIS.map(emoji => {
              const users = reactions[emoji] || [];
              const hasReacted = user && users.includes(user.id);
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiButton, hasReacted && styles.emojiButtonActive]}
                  onPress={() => handleReact(item.id, emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                  {users.length > 0 && (
                    <Text style={[styles.emojiCount, hasReacted && styles.emojiCountActive]}>
                      {users.length}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBtn}>
              <Heart size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionBtnText}>{totalReactions as number}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setActivePostId(activePostId === item.id ? null : item.id)}
            >
              <MessageCircle size={18} color={activePostId === item.id ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.actionBtnText, activePostId === item.id && { color: COLORS.primary }]}>
                {commentCount > 0 ? `${commentCount} Replies` : 'Reply'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Share2 size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Comment Input */}
          {activePostId === item.id && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts..."
                placeholderTextColor={COLORS.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.commentSendBtn}
                onPress={postComment}
              >
                <Send size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDuoTab = () => (
    <View style={styles.featureTab}>
      {pendingRequests.filter(r => r.mode === 'duo').length > 0 && (
        <View style={styles.requestSection}>
          <Text style={styles.sectionHeading}>Pending Invitations</Text>
          {pendingRequests.filter(r => r.mode === 'duo').map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestSender}>{req.sender?.name}</Text>
                <Text style={styles.requestMode}>wants to pair up for a Duo quest!</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={[styles.requestBtn, styles.acceptBtn]} 
                  onPress={() => respondToRequest(req.id, 'accepted')}
                >
                  <Text style={styles.requestBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.requestBtn, styles.rejectBtn]} 
                  onPress={() => respondToRequest(req.id, 'rejected')}
                >
                  <Text style={[styles.requestBtnText, { color: COLORS.textMuted }]}>Ignore</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.featureIconWrap}>
        <LinearGradient colors={[COLORS.primary, COLORS.warmGlow]} style={styles.featureIconGradient}>
          <Users size={36} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.featureTitle}>Duo Mode</Text>
      <Text style={styles.featureSubtitle}>
        Pair up with a friend. Same quest, shared glory.{'\n'}Find a wanderer in {user?.city || 'your city'} to start.
      </Text>

      <Text style={styles.sectionHeading}>Nearby Wanderers</Text>
      <View style={styles.userList}>
        {nearbyUsers.length === 0 ? (
          <Text style={styles.emptyListText}>No other wanderers in {user?.city} yet.</Text>
        ) : (
          nearbyUsers.map(u => (
            <View key={u.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userNameSmall}>{u.name}</Text>
                <Text style={styles.userMetaSmall}>{u.xp} XP • {u.city}</Text>
              </View>
              <TouchableOpacity 
                style={styles.sendRequestBtn}
                onPress={() => sendMatchRequest(u.id, 'duo')}
              >
                <UserPlus size={16} color={COLORS.primary} />
                <Text style={styles.sendRequestText}>Invite</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.duoPerks}>
        <Text style={styles.duoPerksTitle}>Duo Perks</Text>
        <View style={styles.perkItem}>
          <Text style={styles.perkEmoji}>⚡</Text>
          <Text style={styles.perkText}>2x XP on shared quests</Text>
        </View>
      </View>
    </View>
  );

  const renderSquadsTab = () => (
    <View style={styles.featureTab}>
      {pendingRequests.filter(r => r.mode === 'squad').length > 0 && (
        <View style={styles.requestSection}>
          <Text style={styles.sectionHeading}>Squad Invites</Text>
          {pendingRequests.filter(r => r.mode === 'squad').map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestSender}>{req.sender?.name}</Text>
                <Text style={styles.requestMode}>invited you to their squad!</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={[styles.requestBtn, styles.acceptBtn]} 
                  onPress={() => respondToRequest(req.id, 'accepted')}
                >
                  <Text style={styles.requestBtnText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.requestBtn, styles.rejectBtn]} 
                  onPress={() => respondToRequest(req.id, 'rejected')}
                >
                  <Text style={[styles.requestBtnText, { color: COLORS.textMuted }]}>Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.featureIconWrap}>
        <LinearGradient colors={[COLORS.accent2, COLORS.accent]} style={styles.featureIconGradient}>
          <TrendingUp size={36} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.featureTitle}>Squads</Text>
      <Text style={styles.featureSubtitle}>
        Rally your crew. Join or create a squad with up to 6 wanderers in {user?.city || 'your city'}.
      </Text>

      <Text style={styles.sectionHeading}>Nearby Wanderers</Text>
      <View style={styles.userList}>
        {nearbyUsers.length === 0 ? (
          <Text style={styles.emptyListText}>No other wanderers in {user?.city} yet.</Text>
        ) : (
          nearbyUsers.map(u => (
            <View key={u.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userNameSmall}>{u.name}</Text>
                <Text style={styles.userMetaSmall}>{u.xp} XP</Text>
              </View>
              <TouchableOpacity 
                style={[styles.sendRequestBtn, { borderColor: COLORS.accent }]}
                onPress={() => sendMatchRequest(u.id, 'squad')}
              >
                <Sparkles size={16} color={COLORS.accent} />
                <Text style={[styles.sendRequestText, { color: COLORS.accent }]}>Recruit</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Gathering stories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Flame size={22} color={COLORS.primary} fill={COLORS.primary} />
            <Text style={styles.headerTitle}>The Bonfire</Text>
          </View>
          <Text style={styles.headerSubtitle}>Where wanderers share their tales</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { width: tabWidth, transform: [{ translateX }] }]} />
          {(['feed', 'duo', 'squads'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => switchTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'feed' ? 'Stories' : tab === 'duo' ? 'Duo' : 'Squads'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Flame size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>The bonfire's quiet...</Text>
              <Text style={styles.emptySubtitle}>
                Complete a quest and share your story to light the first flame!
              </Text>
            </View>
          }
        />
      ) : activeTab === 'duo' ? (
        <FlatList
          data={[{ key: 'duo' }]}
          renderItem={() => renderDuoTab()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={[{ key: 'squads' }]}
          renderItem={() => renderSquadsTab()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },

  // Header
  header: {
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingTop: 56,
  },
  headerTop: { paddingHorizontal: 24, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  headerSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12 },

  // Tabs
  tabBar: {
    flexDirection: 'row', marginHorizontal: 24, position: 'relative',
    backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 3,
    marginBottom: 0,
  },
  tabIndicator: {
    position: 'absolute', top: 3, left: 3, bottom: 3,
    backgroundColor: COLORS.surface, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 4,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', zIndex: 1 },
  tabText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.text, fontWeight: '700' },

  // List
  listContent: { padding: 16, paddingTop: 20 },

  // Post Card
  postCard: {
    backgroundColor: COLORS.surface, borderRadius: 24, marginBottom: 20,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  postHeader: {
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatarRing: { width: 44, height: 44, borderRadius: 22 },
  avatarGradient: {
    width: 44, height: 44, borderRadius: 22, padding: 2, justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  userName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 15 },
  postTime: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 10, textTransform: 'none' },
  questBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.accentGlow, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  questBadgeText: { ...TYPOGRAPHY.tiny, color: COLORS.accent, fontSize: 9 },

  // Quest title in post
  questTitleWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  questTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, fontSize: 17 },

  // Image
  imageContainer: { position: 'relative' },
  postImage: { width: '100%', aspectRatio: 1 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },

  // Caption
  captionWrap: { paddingHorizontal: 16, paddingTop: 14 },
  caption: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },

  // Reactions
  reactionSection: { padding: 16, gap: 12 },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'transparent',
  },
  emojiButtonActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow,
  },
  emojiText: { fontSize: 16 },
  emojiCount: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  emojiCountActive: { color: COLORS.primary },

  // Actions
  actionBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionBtnText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },

  // Empty state
  emptyState: { padding: 60, alignItems: 'center', gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textSecondary },
  emptySubtitle: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 22 },

  // Feature tabs (Duo & Squads)
  featureTab: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  featureIconWrap: { marginBottom: 24 },
  featureIconGradient: {
    width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 8,
  },
  featureTitle: { ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: 12 },
  featureSubtitle: {
    ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  featureButton: { borderRadius: 16, overflow: 'hidden', width: '100%', marginBottom: 40 },
  featureButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 24,
  },
  featureButtonText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },

  // Perks
  duoPerks: {
    width: '100%', backgroundColor: COLORS.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  duoPerksTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: 16 },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  perkEmoji: { fontSize: 20 },
  perkText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 14 },

  // Social Interactions
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text,
    ...TYPOGRAPHY.body, fontSize: 14,
  },
  commentSendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
  },

  // Matchmaking Requests
  requestSection: { width: '100%', marginBottom: 24 },
  sectionHeading: { 
    ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginBottom: 12, 
    letterSpacing: 1, fontWeight: '700', alignSelf: 'flex-start' 
  },
  requestCard: {
    backgroundColor: COLORS.surfaceHighlight, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.primary + '40', marginBottom: 12,
  },
  requestInfo: { marginBottom: 12 },
  requestSender: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 15 },
  requestMode: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontSize: 13 },
  requestActions: { flexDirection: 'row', gap: 10 },
  requestBtn: { 
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  acceptBtn: { backgroundColor: COLORS.primary },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  requestBtnText: { ...TYPOGRAPHY.caption, color: '#fff', fontWeight: '700' },

  // User List
  userList: { width: '100%', gap: 10, marginBottom: 24 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  userInfo: { gap: 2 },
  userNameSmall: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 15 },
  userMetaSmall: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, textTransform: 'none' },
  sendRequestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  sendRequestText: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  emptyListText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
});
