import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import { ChevronLeft, Clock, Trophy, Compass, Star, CheckCircle } from 'lucide-react-native';

export const QuestDetailScreen = ({ route, navigation }: any) => {
  const { questId } = route.params;
  const [quest, setQuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchQuestDetail();
  }, [questId]);

  const fetchQuestDetail = async () => {
    try {
      const response = await api.get('/quests/active');
      const found = response.data.quests.find((q: any) => q.id === questId);
      setQuest(found);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      console.error('Failed to fetch quest detail', error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading quest...</Text>
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={styles.errorContainer}>
        <Compass size={40} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Quest vanished into the mist...</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Head back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tips = [
    "Stay present — soak in every detail around you.",
    "Snap a photo to immortalize this moment.",
    "Respect nature, locals, and fellow wanderers.",
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quest Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: COLORS.primaryGlow }]}>
              <Compass size={12} color={COLORS.primary} />
              <Text style={styles.categoryText}>{quest.category}</Text>
            </View>
            <View style={[styles.difficultyBadge, {
              backgroundColor: getDifficultyColor(quest.difficulty) + '15',
              borderColor: getDifficultyColor(quest.difficulty) + '30',
            }]}>
              <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(quest.difficulty) }]} />
              <Text style={[styles.difficultyText, { color: getDifficultyColor(quest.difficulty) }]}>
                {quest.difficulty}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{quest.title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Clock size={18} color={COLORS.textSecondary} />
              <Text style={styles.metaValue}>{quest.estimated_time}</Text>
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
            <View style={styles.metaCard}>
              <Trophy size={18} color={COLORS.xpGold} />
              <Text style={[styles.metaValue, { color: COLORS.xpGold }]}>50 XP</Text>
              <Text style={styles.metaLabel}>Reward</Text>
            </View>
            <View style={styles.metaCard}>
              <Star size={18} color={COLORS.secondary} />
              <Text style={styles.metaValue}>1</Text>
              <Text style={styles.metaLabel}>Badge</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Objective */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Mission</Text>
            <Text style={styles.description}>{quest.description}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Wayward Wisdom</Text>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <CheckCircle size={14} color={COLORS.accent} />
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CompleteQuest', { questId: quest.id })}
          >
            <LinearGradient
              colors={[COLORS.accent, '#00B894']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.completeButton}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.completeButtonText}>Mark as Conquered</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  errorContainer: {
    flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  backLink: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, fontSize: 17 },

  scrollContent: { padding: 24, paddingBottom: 40 },

  // Badges
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  categoryText: { ...TYPOGRAPHY.tiny, color: COLORS.primary, fontSize: 10 },
  difficultyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  difficultyText: { ...TYPOGRAPHY.tiny, fontSize: 10 },

  // Title
  title: { ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: 24 },

  // Meta cards
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  metaCard: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metaValue: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  metaLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none' },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 28 },

  section: { marginBottom: 28 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 12 },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 26 },

  // Tips
  tipsContainer: {
    backgroundColor: COLORS.surface, padding: 20, borderRadius: 20,
    marginBottom: 32, borderWidth: 1, borderColor: COLORS.border,
  },
  tipsTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: 16 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipBullet: { marginTop: 2 },
  tipText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, flex: 1, lineHeight: 22, fontSize: 14 },

  // Complete button
  completeButton: {
    borderRadius: 18, padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  completeButtonText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },
});
