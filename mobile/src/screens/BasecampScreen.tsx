import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import {
  LogOut, User, Settings, Bell, Shield, ChevronRight, Mountain,
  Star, Trophy, Flame, Compass, Award, Map, Zap
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const RANKS = [
  { min: 0, name: 'Wanderer', color: COLORS.textSecondary },
  { min: 5, name: 'Explorer', color: COLORS.bronze },
  { min: 15, name: 'Trailblazer', color: COLORS.silver },
  { min: 30, name: 'Pathfinder', color: COLORS.gold },
  { min: 50, name: 'Legend', color: COLORS.diamond },
];

const BADGES = [
  { id: '1', emoji: '🌅', name: 'First Light', desc: 'Complete your first quest', unlocked: false },
  { id: '2', emoji: '🔥', name: 'On Fire', desc: '3-day streak', unlocked: false },
  { id: '3', emoji: '🏔️', name: 'Peak Seeker', desc: 'Complete 5 outdoor quests', unlocked: false },
  { id: '4', emoji: '📸', name: 'Storyteller', desc: 'Share 3 photos', unlocked: false },
  { id: '5', emoji: '🤝', name: 'Duo Spirit', desc: 'Complete a duo quest', unlocked: false },
  { id: '6', emoji: '⚡', name: 'Speed Demon', desc: 'Finish a quest in < 15 min', unlocked: false },
];

export const BasecampScreen = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserStats();
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Leave Basecamp?',
      'You can always come back to continue your adventure.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: logout }
      ]
    );
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/me/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user stats', error);
    }
  };

  const currentRank = RANKS.reduce((prev, rank) => ((userStats?.completed_count || 0) >= rank.min ? rank : prev), RANKS[0]);
  const xp = userStats?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXP = level * 100;
  const progress = (xp % 100);

  const ProfileItem = ({ icon: Icon, label, value, onPress, toggle, iconColor }: any) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrapper, iconColor && { backgroundColor: iconColor + '15' }]}>
          <Icon size={18} color={iconColor || COLORS.textSecondary} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        {toggle !== undefined ? (
          <Switch
            value={toggle}
            onValueChange={setNotifications}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '60' }}
            thumbColor={toggle ? COLORS.primary : COLORS.textMuted}
          />
        ) : (
          onPress && <ChevronRight size={18} color={COLORS.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Mountain size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Basecamp</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,107,53,0.08)', 'transparent']}
              style={styles.profileGlow}
            />
            <View style={styles.avatarSection}>
              <View style={styles.avatarRing}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.avatarGradient}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{user?.name?.[0] || 'W'}</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.nameSection}>
                <Text style={styles.userName}>{user?.name}</Text>
                <View style={styles.rankBadge}>
                  <Star size={10} color={currentRank.color} fill={currentRank.color} />
                  <Text style={[styles.rankText, { color: currentRank.color }]}>{currentRank.name}</Text>
                </View>
              </View>
            </View>

            {/* XP Progress */}
            <View style={styles.xpSection}>
              <View style={styles.xpHeader}>
                <Text style={styles.levelText}>Level {level}</Text>
                <Text style={styles.xpLabel}>{xp} / {nextLevelXP} XP</Text>
              </View>
              <View style={styles.xpBarBg}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.xpBarFill, { width: `${progress}%` }]}
                />
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Compass size={16} color={COLORS.accent} />
                <Text style={styles.quickStatValue}>{userStats?.completed_count || 0}</Text>
                <Text style={styles.quickStatLabel}>Quests</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Flame size={16} color={COLORS.warmGlow} />
                <Text style={styles.quickStatValue}>{userStats?.streak || 0}</Text>
                <Text style={styles.quickStatLabel}>Streak</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Zap size={16} color={COLORS.secondary} />
                <Text style={styles.quickStatValue}>{userStats?.xp || 0}</Text>
                <Text style={styles.quickStatLabel}>XP</Text>
              </View>
            </View>
          </View>

          {/* Badges Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={16} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Badges</Text>
              <Text style={styles.badgeCount}>0/{BADGES.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
              {BADGES.map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
                >
                  <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
                    {badge.emoji}
                  </Text>
                  <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.settingsSectionTitle}>Settings</Text>
            <View style={styles.card}>
              <ProfileItem icon={Map} label="Home Turf" value={user?.city || 'Not set'} onPress={() => {}} iconColor={COLORS.accent} />
              <ProfileItem icon={Bell} label="Quest Alerts" toggle={notifications} iconColor={COLORS.secondary} />
              <ProfileItem icon={Shield} label="Privacy" onPress={() => {}} iconColor={COLORS.accent2} />
              <ProfileItem icon={Settings} label="Preferences" onPress={() => {}} iconColor={COLORS.textSecondary} />
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Leave Basecamp</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Wayward v2.0 — Go Beyond</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },

  scrollContent: { padding: 20, paddingBottom: 40 },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 28, overflow: 'hidden',
  },
  profileGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarRing: { width: 64, height: 64, borderRadius: 32 },
  avatarGradient: {
    width: 64, height: 64, borderRadius: 32, padding: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { ...TYPOGRAPHY.h2, color: COLORS.text, fontSize: 24 },
  nameSection: { flex: 1 },
  userName: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 4 },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  rankText: { ...TYPOGRAPHY.tiny, fontSize: 10 },

  // XP
  xpSection: { marginBottom: 20 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 14 },
  xpLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12 },
  xpBarBg: { height: 8, backgroundColor: COLORS.xpBarBg, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: 8, borderRadius: 4, minWidth: 8 },

  // Quick Stats
  quickStats: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceLight,
    borderRadius: 16, paddingVertical: 16,
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 4 },
  quickStatDivider: { width: 1, backgroundColor: COLORS.border },
  quickStatValue: { ...TYPOGRAPHY.h3, color: COLORS.text, fontSize: 20 },
  quickStatLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9 },

  // Badges
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, flex: 1 },
  badgeCount: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  badgeScroll: { marginHorizontal: -4 },
  badgeItem: {
    width: 110, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: COLORS.border,
  },
  badgeLocked: { opacity: 0.4 },
  badgeEmoji: { fontSize: 28, marginBottom: 8 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeName: { ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { color: COLORS.textMuted },
  badgeDesc: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, textAlign: 'center', fontSize: 8, textTransform: 'none' },

  // Settings
  settingsSectionTitle: {
    ...TYPOGRAPHY.tiny, color: COLORS.textSecondary, marginBottom: 10, marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  profileItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  itemLabel: { ...TYPOGRAPHY.body, color: COLORS.text, fontSize: 15 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemValue: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.15)', marginBottom: 8,
  },
  logoutText: { ...TYPOGRAPHY.button, color: COLORS.error, fontSize: 15 },

  versionText: {
    textAlign: 'center', ...TYPOGRAPHY.caption, color: COLORS.textMuted,
    marginTop: 24, fontSize: 11,
  },
});
