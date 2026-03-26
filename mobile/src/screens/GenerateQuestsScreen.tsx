import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import { ChevronLeft, Clock, Sparkles, Trophy, Compass, ChevronRight, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TIME_OPTIONS = [
  { label: '30 min', emoji: '⚡', desc: 'Quick dash' },
  { label: '1 hour', emoji: '🌤️', desc: 'Easy stroll' },
  { label: '2 hours', emoji: '🏃', desc: 'Good trek' },
  { label: 'Half day', emoji: '🗺️', desc: 'Full explore' },
  { label: 'Full day', emoji: '🏕️', desc: 'Epic journey' },
];

export const GenerateQuestsScreen = ({ navigation }: any) => {
  const [selectedTime, setSelectedTime] = useState('1 hour');
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.get('/quests/generate', {
        params: { time_available: selectedTime }
      });
      setQuests(response.data.quests);
    } catch (error) {
      console.error('Generation failed', error);
      Alert.alert('Oops!', 'The quest spirits are resting. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (questId: string) => {
    try {
      await api.post(`/quests/${questId}/accept`);
      Alert.alert('Quest Accepted!', "Your adventure awaits, wanderer!", [
        { text: "Let's go!", onPress: () => navigation.navigate('HomeRoot') }
      ]);
    } catch (error) {
      console.error('Accept failed', error);
    }
  };

  const getDifficultyColor = (diff: string) => {
    const d = diff?.toLowerCase();
    if (d === 'easy') return COLORS.accent;
    if (d === 'medium') return COLORS.secondary;
    if (d === 'hard') return COLORS.warmGlow;
    return COLORS.textMuted;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={16} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>Craft Adventure</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How much time do you have?</Text>
          <Text style={styles.sectionHint}>Pick your pace and we'll match the quest</Text>

          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.timeCard,
                  selectedTime === opt.label && styles.timeCardActive
                ]}
                onPress={() => setSelectedTime(opt.label)}
                activeOpacity={0.7}
              >
                {selectedTime === opt.label && (
                  <LinearGradient
                    colors={[COLORS.primaryGlow, 'transparent']}
                    style={styles.timeCardGlow}
                  />
                )}
                <Text style={styles.timeEmoji}>{opt.emoji}</Text>
                <Text style={[
                  styles.timeLabel,
                  selectedTime === opt.label && styles.timeLabelActive
                ]}>{opt.label}</Text>
                <Text style={styles.timeDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? [COLORS.surfaceLight, COLORS.surfaceLight] : [COLORS.primary, COLORS.warmGlow]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.generateButton}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.textMuted} />
                <Text style={styles.loadingText}>Conjuring quests...</Text>
              </View>
            ) : (
              <>
                <Sparkles color="#fff" size={20} />
                <Text style={styles.generateText}>Summon Quests</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Results */}
        {quests.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsTitleRow}>
              <Compass size={18} color={COLORS.accent} />
              <Text style={styles.resultsTitle}>Choose your path</Text>
            </View>

            {quests.map((quest, index) => (
              <View key={quest.id} style={styles.questCard}>
                <View style={styles.questCardHeader}>
                  <View style={styles.questCardLeft}>
                    <View style={[styles.questIndex, {
                      backgroundColor: index === 0 ? COLORS.primaryGlow : index === 1 ? COLORS.accentGlow : COLORS.accent2Glow
                    }]}>
                      <Text style={[styles.questIndexText, {
                        color: index === 0 ? COLORS.primary : index === 1 ? COLORS.accent : COLORS.accent2
                      }]}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.questCategory}>{quest.category}</Text>
                      <Text style={styles.questTitle} numberOfLines={2}>{quest.title}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.questDesc} numberOfLines={3}>{quest.description}</Text>

                <View style={styles.questMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{quest.estimated_time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(quest.difficulty) }]} />
                    <Text style={[styles.metaText, { color: getDifficultyColor(quest.difficulty) }]}>
                      {quest.difficulty}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Trophy size={12} color={COLORS.xpGold} />
                    <Text style={styles.xpText}>50 XP</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(quest.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptText}>Accept Quest</Text>
                  <ChevronRight size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, fontSize: 17 },

  scrollContent: { padding: 20, paddingBottom: 40 },

  // Section
  section: { marginBottom: 28 },
  sectionLabel: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 4 },
  sectionHint: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: 18, fontSize: 12 },

  // Time Grid
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeCard: {
    width: (width - 50) / 2 - 5, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  timeCardActive: { borderColor: COLORS.primary },
  timeCardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 50 },
  timeEmoji: { fontSize: 24 },
  timeLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, fontSize: 14 },
  timeLabelActive: { color: COLORS.primary },
  timeDesc: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none' },

  // Generate
  generateButton: {
    borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 32,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  generateText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },

  // Results
  resultsSection: { gap: 16 },
  resultsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resultsTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },

  // Quest Card
  questCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  questCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  questCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  questIndex: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  questIndexText: { ...TYPOGRAPHY.bodyBold, fontSize: 14 },
  questCategory: { ...TYPOGRAPHY.tiny, color: COLORS.primary, marginBottom: 4, fontSize: 9 },
  questTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 16 },
  questDesc: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },

  questMeta: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12 },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  xpText: { ...TYPOGRAPHY.caption, color: COLORS.xpGold, fontWeight: '700', fontSize: 12 },

  acceptButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primaryGlow, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
  },
  acceptText: { ...TYPOGRAPHY.button, color: COLORS.primary },
});
