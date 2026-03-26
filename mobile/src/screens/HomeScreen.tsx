import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import {
  Sparkles, Zap, MapPin, Compass, ChevronRight, Flame, Trophy, Star,
  Clock, Play, Square, Timer, Target, TrendingUp, Award
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GREETINGS = [
  "Ready to roam?",
  "Where to, wanderer?",
  "The unknown awaits...",
  "Adventure is calling!",
  "Time to wander!",
  "Go beyond the map.",
];

const DAILY_CHALLENGES = [
  { emoji: '📸', text: 'Take a photo of something you walk past every day but never noticed' },
  { emoji: '🗣️', text: 'Strike up a conversation with a stranger at a cafe' },
  { emoji: '🚶', text: 'Take a different route home today' },
  { emoji: '🌅', text: 'Find the best sunset spot within walking distance' },
  { emoji: '🎵', text: 'Discover a street musician or live music nearby' },
  { emoji: '🍜', text: 'Try food from a cuisine you have never had before' },
];

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting] = useState(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [dailyChallenge] = useState(DAILY_CHALLENGES[new Date().getDay() % DAILY_CHALLENGES.length]);

  // Adventure Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerQuestId, setTimerQuestId] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const timerGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchActiveQuests();
    fetchUserStats();
    loadTimerState();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerGlow, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(timerGlow, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive]);

  const loadTimerState = async () => {
    try {
      const stored = await AsyncStorage.getItem('adventure_timer');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.active && data.startTime) {
          const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
          setTimerSeconds(elapsed);
          setTimerActive(true);
          setTimerQuestId(data.questId);
        }
      }
    } catch (e) {}
  };

  const startTimer = async (questId?: string) => {
    const startTime = Date.now();
    setTimerActive(true);
    setTimerSeconds(0);
    setTimerQuestId(questId || null);
    await AsyncStorage.setItem('adventure_timer', JSON.stringify({
      active: true, startTime, questId: questId || null,
    }));
  };

  const stopTimer = async () => {
    setTimerActive(false);
    const totalTime = timerSeconds;
    setTimerSeconds(0);
    setTimerQuestId(null);
    await AsyncStorage.removeItem('adventure_timer');
    return totalTime;
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchActiveQuests = async () => {
    try {
      const response = await api.get('/quests/active');
      setActiveQuests(response.data.quests);
    } catch (error) {
      console.error('Failed to fetch quests', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/me/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user stats', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActiveQuests(), fetchUserStats()]);
    setRefreshing(false);
  };

  const handleImBored = async () => {
    setLoading(true);
    try {
      await api.post('/quests/bored');
      await fetchActiveQuests();
    } catch (error) {
      console.error('Bored quest failed', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    const d = diff?.toLowerCase();
    if (d === 'easy') return COLORS.accent;
    if (d === 'medium') return COLORS.secondary;
    if (d === 'hard') return COLORS.warmGlow;
    return COLORS.textMuted;
  };

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 6) return 'night';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'evening';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();
  const timeEmoji = timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : timeOfDay === 'evening' ? '🌆' : '🌙';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>
              {timeEmoji} Good {timeOfDay}, {user?.name?.split(' ')[0] || 'Wanderer'}
            </Text>
            <Text style={styles.title}>{greeting}</Text>
          </View>
          <TouchableOpacity style={styles.locationBadge}>
            <MapPin size={11} color={COLORS.primary} />
            <Text style={styles.locationText}>{user?.city || 'Everywhere'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Live Adventure Timer */}
        <View style={styles.timerSection}>
          {timerActive ? (
            <View style={styles.timerCard}>
              <LinearGradient
                colors={['rgba(255,107,53,0.08)', 'transparent']}
                style={styles.timerGlow}
              />
              <View style={styles.timerLeft}>
                <Animated.View style={{ opacity: timerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }}>
                  <View style={styles.timerDotLive} />
                </Animated.View>
                <View>
                  <Text style={styles.timerLabel}>ADVENTURE IN PROGRESS</Text>
                  <Text style={styles.timerValue}>{formatTime(timerSeconds)}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={stopTimer}
                style={styles.timerStopBtn}
              >
                <Square size={14} color={COLORS.error} fill={COLORS.error} />
                <Text style={styles.timerStopText}>End</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.timerStartCard}
              onPress={() => startTimer()}
              activeOpacity={0.8}
            >
              <View style={styles.timerStartLeft}>
                <View style={styles.timerPlayIcon}>
                  <Play size={16} color={COLORS.accent} fill={COLORS.accent} />
                </View>
                <View>
                  <Text style={styles.timerStartTitle}>Start Adventure Clock</Text>
                  <Text style={styles.timerStartSub}>Track your exploration time</Text>
                </View>
              </View>
              <Timer size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* XP & Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statMini}>
            <Star size={12} color={COLORS.xpGold} fill={COLORS.xpGold} />
            <Text style={styles.statMiniText}>Lv {Math.floor((userStats?.xp || 0) / 100) + 1}</Text>
          </View>
          <View style={styles.xpBarWrap}>
            <View style={styles.xpBarBg}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.xpBarFill, { width: `${(userStats?.xp || 0) % 100}%` }]}
              />
            </View>
          </View>
          <Text style={styles.xpLabel}>{userStats?.xp || 0}/{Math.floor(((userStats?.xp || 0) / 100) + 1) * 100} XP</Text>
        </View>

        {/* Quick Actions - Compact Row */}
        <View style={styles.quickActions}>
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleImBored} disabled={loading}>
              <LinearGradient
                colors={['#FF6B35', '#FF4E6A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Zap color="#fff" fill="#fff" size={20} />
                    <Text style={styles.actionTitle}>Surprise Me!</Text>
                    <Text style={styles.actionSub}>Instant quest</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('GenerateQuests')}
          >
            <LinearGradient
              colors={[COLORS.accent2, '#6644EE']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.actionCard}
            >
              <Sparkles color="#fff" size={20} />
              <Text style={styles.actionTitle}>Craft Quest</Text>
              <Text style={styles.actionSub}>AI-powered</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge */}
        <View style={styles.dailyChallenge}>
          <View style={styles.dailyChallengeHeader}>
            <Target size={16} color={COLORS.secondary} />
            <Text style={styles.dailyChallengeLabel}>DAILY CHALLENGE</Text>
          </View>
          <View style={styles.dailyChallengeContent}>
            <Text style={styles.dailyChallengeEmoji}>{dailyChallenge.emoji}</Text>
            <Text style={styles.dailyChallengeText}>{dailyChallenge.text}</Text>
          </View>
          <View style={styles.dailyChallengeReward}>
            <Trophy size={12} color={COLORS.xpGold} />
            <Text style={styles.dailyChallengeXP}>+25 bonus XP</Text>
          </View>
        </View>

        {/* Active Quests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Compass size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Active Quests</Text>
            </View>
            {activeQuests.length > 0 && (
              <Text style={styles.questCount}>{activeQuests.length} in progress</Text>
            )}
          </View>

          {activeQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Compass size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No active quests</Text>
              <Text style={styles.emptyText}>Hit "Surprise Me!" to get started!</Text>
            </View>
          ) : (
            activeQuests.map((quest, index) => (
              <TouchableOpacity
                key={quest.id}
                style={styles.questCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('QuestDetail', { questId: quest.id })}
              >
                <View style={[styles.questAccent, {
                  backgroundColor: index === 0 ? COLORS.primary : index === 1 ? COLORS.accent2 : COLORS.accent,
                }]} />
                <View style={styles.questCardContent}>
                  <View style={styles.questTagRow}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{quest.category}</Text>
                    </View>
                    <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(quest.difficulty) }]} />
                    <Text style={[styles.difficultyLabel, { color: getDifficultyColor(quest.difficulty) }]}>
                      {quest.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.questTitle} numberOfLines={2}>{quest.title}</Text>
                  <View style={styles.questMeta}>
                    <View style={styles.questMetaItem}>
                      <Clock size={10} color={COLORS.textMuted} />
                      <Text style={styles.questTime}>{quest.estimated_time}</Text>
                    </View>
                    <View style={styles.questMetaItem}>
                      <Trophy size={10} color={COLORS.xpGold} />
                      <Text style={styles.xpMiniText}>50 XP</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.questArrow}>
                  {!timerActive && (
                    <TouchableOpacity
                      onPress={() => { startTimer(quest.id); }}
                      style={styles.questPlayBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Play size={12} color={COLORS.accent} fill={COLORS.accent} />
                    </TouchableOpacity>
                  )}
                  <ChevronRight color={COLORS.textMuted} size={16} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.bottomStats}>
          <View style={styles.bottomStatCard}>
            <TrendingUp size={16} color={COLORS.accent} />
            <Text style={styles.bottomStatValue}>{userStats?.completed_count || 0}</Text>
            <Text style={styles.bottomStatLabel}>Completed</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Flame size={16} color={COLORS.warmGlow} />
            <Text style={styles.bottomStatValue}>{userStats?.streak || 0}</Text>
            <Text style={styles.bottomStatLabel}>Day Streak</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Award size={16} color={COLORS.secondary} />
            <Text style={styles.bottomStatValue}>{userStats?.badges_count || 0}</Text>
            <Text style={styles.bottomStatLabel}>Badges</Text>
          </View>
        </View>

        {/* Streak Nudge */}
        <View style={styles.streakNudge}>
          <Flame size={16} color={COLORS.streakFlame} />
          <Text style={styles.streakNudgeText}>Complete a quest today to start your streak!</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },

  // Header
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  welcomeText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 4, fontSize: 12 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, fontSize: 22 },
  locationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryGlow, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', marginTop: 4,
  },
  locationText: { ...TYPOGRAPHY.tiny, color: COLORS.primaryLight, fontSize: 9, textTransform: 'none' },

  // Timer
  timerSection: { paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  timerCard: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: COLORS.primary + '30', overflow: 'hidden',
  },
  timerGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerDotLive: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6,
  },
  timerLabel: { ...TYPOGRAPHY.tiny, color: COLORS.primary, fontSize: 9, marginBottom: 2 },
  timerValue: { ...TYPOGRAPHY.h2, color: COLORS.text, fontSize: 24, fontWeight: '800' },
  timerStopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,71,87,0.1)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,71,87,0.2)',
  },
  timerStopText: { ...TYPOGRAPHY.caption, color: COLORS.error, fontWeight: '700' },

  timerStartCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: COLORS.border,
  },
  timerStartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerPlayIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accentGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  timerStartTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 14 },
  timerStartSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11 },

  // XP Stats Row
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, marginBottom: 16,
  },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statMiniText: { ...TYPOGRAPHY.tiny, color: COLORS.textWarm, fontSize: 10, textTransform: 'none' },
  xpBarWrap: { flex: 1 },
  xpBarBg: { height: 5, backgroundColor: COLORS.xpBarBg, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: 5, borderRadius: 3 },
  xpLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none' },

  // Quick Actions
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  actionCard: {
    borderRadius: 18, padding: 18, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
    elevation: 5,
  },
  actionTitle: { ...TYPOGRAPHY.bodyBold, color: '#fff', fontSize: 14 },
  actionSub: { ...TYPOGRAPHY.tiny, color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'none' },

  // Daily Challenge
  dailyChallenge: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dailyChallengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dailyChallengeLabel: { ...TYPOGRAPHY.tiny, color: COLORS.secondary, fontSize: 9 },
  dailyChallengeContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  dailyChallengeEmoji: { fontSize: 28 },
  dailyChallengeText: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1, fontSize: 14, lineHeight: 21 },
  dailyChallengeReward: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.secondaryGlow, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  dailyChallengeXP: { ...TYPOGRAPHY.tiny, color: COLORS.secondary, fontSize: 10, textTransform: 'none' },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 16 },
  questCount: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11 },

  // Empty
  emptyState: {
    padding: 30, alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, marginBottom: 4, fontSize: 14 },
  emptyText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12 },

  // Quest Cards
  questCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  questAccent: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  questCardContent: { flex: 1, gap: 5, paddingLeft: 10 },
  questTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryPill: { backgroundColor: COLORS.primaryGlow, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  categoryPillText: { ...TYPOGRAPHY.tiny, color: COLORS.primary, fontSize: 8 },
  difficultyDot: { width: 5, height: 5, borderRadius: 3 },
  difficultyLabel: { ...TYPOGRAPHY.tiny, fontSize: 8 },
  questTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 14 },
  questMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  questTime: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none' },
  xpMiniText: { ...TYPOGRAPHY.tiny, color: COLORS.xpGold, fontSize: 9, textTransform: 'none' },
  questArrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  questPlayBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.accentGlow,
    justifyContent: 'center', alignItems: 'center',
  },

  // Bottom Stats
  bottomStats: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  bottomStatCard: {
    flex: 1, alignItems: 'center', gap: 4, backgroundColor: COLORS.surface,
    borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  bottomStatValue: { ...TYPOGRAPHY.h3, color: COLORS.text, fontSize: 18 },
  bottomStatLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 8 },

  // Streak
  streakNudge: {
    marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warmGlowBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,78,106,0.15)',
  },
  streakNudgeText: { ...TYPOGRAPHY.caption, color: COLORS.warmGlow, flex: 1, fontSize: 11 },
});
