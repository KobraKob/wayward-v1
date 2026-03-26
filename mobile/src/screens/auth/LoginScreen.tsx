import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { LogIn, Compass, ChevronLeft } from 'lucide-react-native';
import { Image } from 'react-native';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { setError('Fill in all fields to continue'); return; }
    setLoading(true);
    setError(null);
    try { await login(email, password); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ChevronLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logo / Branding */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Wayward</Text>
          </View>

          {/* Title */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome back,{'\n'}wanderer</Text>
            <Text style={styles.subtitle}>Your next adventure is waiting.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Your secret passphrase"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error && (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? [COLORS.surfaceLight, COLORS.surfaceLight] : [COLORS.primary, COLORS.primaryDark]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.textMuted} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Continue Journey</Text>
                    <LogIn color="#fff" size={18} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Start Exploring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginLeft: 24, marginTop: 56,
  },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  // Brand
  brandSection: { alignItems: 'center', marginBottom: 32 },
  logoImage: { width: 64, height: 64, borderRadius: 18, marginBottom: 12 },
  brandName: { ...TYPOGRAPHY.hero, color: COLORS.text, fontSize: 26 },

  // Header
  headerSection: { marginBottom: 32 },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: 8 },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },

  // Form
  form: { gap: 18 },
  inputContainer: { gap: 8 },
  label: { ...TYPOGRAPHY.tiny, color: COLORS.textSecondary, marginLeft: 4 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 16,
  },
  errorWrap: {
    backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.15)',
  },
  errorText: { color: COLORS.error, ...TYPOGRAPHY.caption, textAlign: 'center' },

  button: {
    borderRadius: 16, padding: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { ...TYPOGRAPHY.button, color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: COLORS.textSecondary, ...TYPOGRAPHY.body, fontSize: 14 },
  footerLink: { color: COLORS.primary, ...TYPOGRAPHY.bodyBold, fontSize: 14 },
});
