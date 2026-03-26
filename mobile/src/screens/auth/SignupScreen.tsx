import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { ArrowRight, ChevronLeft, Check, Compass, Mountain, Coffee, Sunrise, Moon, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Step = 'info' | 'vibe' | 'ready';

const VIBE_OPTIONS = [
  { id: 'explorer', emoji: '🧭', label: 'Explorer', desc: 'I want to discover hidden gems', icon: Compass },
  { id: 'thrill', emoji: '⚡', label: 'Thrill Seeker', desc: 'Give me the adrenaline', icon: Zap },
  { id: 'chill', emoji: '☕', label: 'Chill Wanderer', desc: 'Slow down and soak it in', icon: Coffee },
  { id: 'social', emoji: '🤝', label: 'Social Butterfly', desc: 'Adventures are better shared', icon: Mountain },
];

const TIME_PREFS = [
  { id: 'early', emoji: '🌅', label: 'Early Bird', icon: Sunrise },
  { id: 'anytime', emoji: '☀️', label: 'Anytime', icon: Compass },
  { id: 'night', emoji: '🌙', label: 'Night Owl', icon: Moon },
];

export const SignupScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [vibe, setVibe] = useState<string | null>(null);
  const [timePref, setTimePref] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStep = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const goToVibe = () => {
    if (!name || !email || !password || !city) {
      setError('All fields are required to begin');
      return;
    }
    setError(null);
    setStep('vibe');
    animateStep();
  };

  const goToReady = () => {
    setStep('ready');
    animateStep();
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      await signup(email, password, name, city);
    } catch (e: any) {
      setError(e.message);
      setStep('info');
      animateStep();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'vibe') { setStep('info'); animateStep(); }
    else if (step === 'ready') { setStep('vibe'); animateStep(); }
    else { navigation.goBack(); }
  };

  const progressWidth = step === 'info' ? '33%' : step === 'vibe' ? '66%' : '100%';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: progressWidth as any }]}
          />
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <ChevronLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Step 1: Basic Info */}
          {step === 'info' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
              <Text style={styles.title}>Who are you,{'\n'}wanderer?</Text>
              <Text style={styles.subtitle}>Tell us the basics so we can personalize your journey.</Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>TRAIL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What should we call you?"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="explorer@wayward.com"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>SECRET PASSPHRASE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Make it strong, adventurer"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>HOME TURF</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. San Francisco, CA"
                    placeholderTextColor={COLORS.textMuted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {error && (
                  <View style={styles.errorWrap}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity onPress={goToVibe} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.continueBtn}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                    <ArrowRight color="#fff" size={18} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already a wanderer? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Continue Journey</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Adventure Vibe */}
          {step === 'vibe' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
              <Text style={styles.title}>What's your{'\n'}adventure vibe?</Text>
              <Text style={styles.subtitle}>This helps our AI craft the perfect quests for you.</Text>

              <Text style={styles.sectionLabel}>I'm a...</Text>
              <View style={styles.vibeGrid}>
                {VIBE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.vibeCard, vibe === opt.id && styles.vibeCardActive]}
                    onPress={() => setVibe(opt.id)}
                    activeOpacity={0.8}
                  >
                    {vibe === opt.id && (
                      <View style={styles.vibeCheck}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                    <Text style={styles.vibeEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.vibeLabel, vibe === opt.id && styles.vibeLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.vibeDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>I adventure best...</Text>
              <View style={styles.timeRow}>
                {TIME_PREFS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.timePill, timePref === opt.id && styles.timePillActive]}
                    onPress={() => setTimePref(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timeEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.timeLabel, timePref === opt.id && styles.timeLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={goToReady} activeOpacity={0.85} style={{ marginTop: 28 }}>
                <LinearGradient colors={[COLORS.accent2, '#6644EE']} style={styles.continueBtn}>
                  <Text style={styles.continueBtnText}>Almost there!</Text>
                  <ArrowRight color="#fff" size={18} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Ready */}
          {step === 'ready' && (
            <View style={[styles.stepContent, { alignItems: 'center', paddingTop: 40 }]}>
              <Text style={styles.stepLabel}>STEP 3 OF 3</Text>

              <View style={styles.readyIconWrap}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.readyIconGradient}
                >
                  <Compass size={44} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={[styles.title, { textAlign: 'center' }]}>
                You're all set,{'\n'}{name.split(' ')[0]}!
              </Text>
              <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
                Your adventure profile is ready.{'\n'}Time to explore the unknown.
              </Text>

              <View style={styles.readyStats}>
                <View style={styles.readyStat}>
                  <Text style={styles.readyStatValue}>Level 1</Text>
                  <Text style={styles.readyStatLabel}>Wanderer</Text>
                </View>
                <View style={styles.readyStatDivider} />
                <View style={styles.readyStat}>
                  <Text style={styles.readyStatValue}>0 XP</Text>
                  <Text style={styles.readyStatLabel}>Starting fresh</Text>
                </View>
                <View style={styles.readyStatDivider} />
                <View style={styles.readyStat}>
                  <Text style={styles.readyStatValue}>{city}</Text>
                  <Text style={styles.readyStatLabel}>Home turf</Text>
                </View>
              </View>

              {error && (
                <View style={[styles.errorWrap, { width: '100%', marginBottom: 16 }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={loading ? [COLORS.surfaceLight, COLORS.surfaceLight] : [COLORS.primary, COLORS.warmGlow]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.launchBtn}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textMuted} />
                  ) : (
                    <>
                      <Text style={styles.launchBtnText}>Launch My Adventure</Text>
                      <ArrowRight color="#fff" size={20} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Progress
  progressContainer: { paddingHorizontal: 24, paddingTop: 56 },
  progressBg: { height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  // Back
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginLeft: 24, marginTop: 16,
  },

  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Step content
  stepContent: { paddingTop: 20 },
  stepLabel: { ...TYPOGRAPHY.tiny, color: COLORS.primary, marginBottom: 12, fontSize: 10 },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: 8 },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: 28, fontSize: 15, lineHeight: 23 },

  // Form
  form: { gap: 16 },
  inputContainer: { gap: 7 },
  label: { ...TYPOGRAPHY.tiny, color: COLORS.textSecondary, marginLeft: 4, fontSize: 10 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 16,
  },
  errorWrap: {
    backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.15)',
  },
  errorText: { color: COLORS.error, ...TYPOGRAPHY.caption, textAlign: 'center' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 17, borderRadius: 16, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  continueBtnText: { ...TYPOGRAPHY.button, color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.textSecondary, ...TYPOGRAPHY.body, fontSize: 14 },
  footerLink: { color: COLORS.primary, ...TYPOGRAPHY.bodyBold, fontSize: 14 },

  // Vibe Step
  sectionLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, marginBottom: 14 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeCard: {
    width: (width - 58) / 2, backgroundColor: COLORS.surface, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.border, position: 'relative',
  },
  vibeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  vibeCheck: {
    position: 'absolute', top: 10, right: 10, width: 22, height: 22,
    borderRadius: 11, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  vibeEmoji: { fontSize: 28, marginBottom: 10 },
  vibeLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 14, marginBottom: 4 },
  vibeLabelActive: { color: COLORS.primary },
  vibeDesc: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },

  timeRow: { flexDirection: 'row', gap: 10 },
  timePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  timePillActive: { borderColor: COLORS.accent2, backgroundColor: COLORS.accent2Glow },
  timeEmoji: { fontSize: 16 },
  timeLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600' },
  timeLabelActive: { color: COLORS.accent2Light },

  // Ready Step
  readyIconWrap: { marginBottom: 28, marginTop: 8 },
  readyIconGradient: {
    width: 96, height: 96, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  readyStats: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 18,
    paddingVertical: 18, width: '100%', marginBottom: 28,
    borderWidth: 1, borderColor: COLORS.border,
  },
  readyStat: { flex: 1, alignItems: 'center' },
  readyStatDivider: { width: 1, backgroundColor: COLORS.border },
  readyStatValue: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 14, marginBottom: 2 },
  readyStatLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none' },
  launchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  launchBtnText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },
});
