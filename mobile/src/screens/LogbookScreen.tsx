import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
  RefreshControl, Dimensions, Animated, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import { Map, Flame, MapPin, Trophy, Star, Compass, Calendar } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const LogbookScreen = () => {
  const { user } = useAuth();
  const [journalData, setJournalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchJournal = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/journal/${user.id}`);
      setJournalData(response.data);
    } catch (error) {
      console.error('Failed to fetch journal', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournal();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJournal();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Opening your logbook...</Text>
      </View>
    );
  }

  const streak = journalData?.streak_days || 0;
  const total = journalData?.total_completed || 0;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.journalCard}>
        {/* Timeline connector */}
        <View style={styles.timelineConnector}>
          <View style={[styles.timelineDot, { backgroundColor: index === 0 ? COLORS.primary : COLORS.surfaceLight }]} />
          {index < (journalData?.quests?.length || 0) - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Card Content */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardDate}>
                {new Date(item.completed_at).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          {item.media && item.media.length > 0 && (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.media[0].photo_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,22,40,0.5)']}
                style={styles.imageOverlay}
              />
            </View>
          )}

          {item.media?.[0]?.note && (
            <View style={styles.noteWrap}>
              <Text style={styles.noteText}>"{item.media[0].note}"</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <MapPin size={12} color={COLORS.textMuted} />
              <Text style={styles.footerText}>{user?.city}</Text>
            </View>
            <View style={styles.footerRight}>
              <Trophy size={12} color={COLORS.xpGold} />
              <Text style={styles.xpEarned}>+50 XP</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Map size={22} color={COLORS.primary} />
            <Text style={styles.title}>Logbook</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={14} color={COLORS.streakFlame} fill={COLORS.streakFlame} />
              <Text style={styles.streakText}>{streak}d</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={journalData?.quests || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={
          <View style={styles.statsSection}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.primaryGlow, 'transparent']}
                  style={styles.statGlow}
                />
                <Compass size={20} color={COLORS.primary} />
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Adventures</Text>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.warmGlowBg, 'transparent']}
                  style={styles.statGlow}
                />
                <Flame size={20} color={COLORS.warmGlow} />
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.secondaryGlow, 'transparent']}
                  style={styles.statGlow}
                />
                <Star size={20} color={COLORS.xpGold} />
                <Text style={styles.statValue}>{total * 50}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </View>

            {total > 0 && (
              <Text style={styles.timelineTitle}>Your Trail</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Calendar size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Your logbook awaits</Text>
            <Text style={styles.emptySubtitle}>
              Every completed quest becomes a page in your story. Start your first adventure!
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.warmGlowBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,78,106,0.2)',
  },
  streakText: { ...TYPOGRAPHY.caption, color: COLORS.warmGlow, fontWeight: '800', fontSize: 13 },

  // Stats
  listContent: { padding: 20, paddingBottom: 30 },
  statsSection: { marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 18, paddingVertical: 18,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 40,
  },
  statValue: { ...TYPOGRAPHY.h2, color: COLORS.text, fontSize: 22 },
  statLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9 },

  timelineTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, marginBottom: 20 },

  // Journal Cards with Timeline
  journalCard: { flexDirection: 'row', marginBottom: 24, gap: 14 },
  timelineConnector: { width: 20, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 6,
  },
  cardBody: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: {
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardDate: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginBottom: 6, textTransform: 'none' },
  cardTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, maxWidth: width * 0.5 },
  categoryBadge: {
    backgroundColor: COLORS.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  categoryText: { ...TYPOGRAPHY.tiny, color: COLORS.primary, fontSize: 9 },

  imageWrap: { position: 'relative' },
  cardImage: { width: '100%', aspectRatio: 16 / 9 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },

  noteWrap: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surfaceLight, marginHorizontal: 12, marginTop: -4, marginBottom: 12,
    borderRadius: 12,
  },
  noteText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontStyle: 'italic', fontSize: 14 },

  cardFooter: {
    padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpEarned: { ...TYPOGRAPHY.caption, color: COLORS.xpGold, fontWeight: '700', fontSize: 12 },

  // Empty
  emptyState: { padding: 50, alignItems: 'center', gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textSecondary },
  emptySubtitle: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
