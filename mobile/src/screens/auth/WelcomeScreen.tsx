import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Animated, Image, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { ChevronRight, Compass, Map, Users, Trophy } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: Compass,
    iconColors: [COLORS.primary, COLORS.warmGlow] as [string, string],
    title: "Go Wayward",
    subtitle: "AI-powered micro-adventures tailored to your city, mood, and time. No two quests are the same.",
    highlight: "Your city is the map.",
  },
  {
    id: '2',
    icon: Trophy,
    iconColors: [COLORS.secondary, COLORS.primary] as [string, string],
    title: "Level Up IRL",
    subtitle: "Earn XP, unlock badges, and climb ranks from Wanderer to Legend. Every step counts.",
    highlight: "Real life is the game.",
  },
  {
    id: '3',
    icon: Users,
    iconColors: [COLORS.accent2, COLORS.accent] as [string, string],
    title: "Share the Trail",
    subtitle: "Team up in Duo or Squad mode. Share stories at The Bonfire. Inspire others to explore.",
    highlight: "Adventure together.",
  },
];

export const WelcomeScreen = ({ navigation }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.slideIconWrap}>
          <LinearGradient colors={item.iconColors} style={styles.slideIconGradient}>
            <Icon size={40} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        <View style={styles.highlightPill}>
          <Text style={styles.highlightText}>{item.highlight}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, '#0D1E35', COLORS.background]}
        style={styles.bgGradient}
      />

      {/* Logo Section */}
      <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Wayward</Text>
        <Text style={styles.tagline}>Go Beyond the Map</Text>
      </Animated.View>

      {/* Slides */}
      <Animated.View style={[styles.slidesContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
        />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
        {activeIndex < SLIDES.length - 1 ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.nextBtn}
              >
                <Text style={styles.nextText}>Next</Text>
                <ChevronRight size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.finalActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.warmGlow]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.startBtn}
              >
                <Text style={styles.startBtnText}>Begin Your Adventure</Text>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already a wanderer? <Text style={styles.loginLinkBold}>Continue Journey</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  // Logo
  logoSection: { alignItems: 'center', paddingTop: height * 0.1, marginBottom: 16 },
  logo: { width: 80, height: 80, borderRadius: 22, marginBottom: 14 },
  appName: { ...TYPOGRAPHY.hero, color: COLORS.text, fontSize: 32 },
  tagline: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 4, fontSize: 14 },

  // Slides
  slidesContainer: { flex: 1, justifyContent: 'center' },
  slide: { width, paddingHorizontal: 36, alignItems: 'center', justifyContent: 'center' },
  slideIconWrap: { marginBottom: 24 },
  slideIconGradient: {
    width: 80, height: 80, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  slideTitle: { ...TYPOGRAPHY.h1, color: COLORS.text, textAlign: 'center', marginBottom: 12 },
  slideSubtitle: {
    ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 24, marginBottom: 20, fontSize: 15,
  },
  highlightPill: {
    backgroundColor: COLORS.primaryGlow, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  highlightText: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary, fontSize: 13 },

  // Dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceLight },
  dotActive: { width: 24, backgroundColor: COLORS.primary },

  // Actions
  actionsSection: { paddingHorizontal: 24, paddingBottom: 40 },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { ...TYPOGRAPHY.bodyBold, color: COLORS.textMuted, fontSize: 15 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
  },
  nextText: { ...TYPOGRAPHY.button, color: '#fff' },

  // Final actions
  finalActions: { gap: 16 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  startBtnText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 14 },
  loginLinkBold: { color: COLORS.primary, fontWeight: '700' },
});
