import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { api } from '../lib/api';
import { ChevronLeft, Camera, Send, X, Image as ImageIcon, PenLine, Trophy } from 'lucide-react-native';

export const CompleteQuestScreen = ({ route, navigation }: any) => {
  const { questId } = route.params;
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(true);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (note) formData.append('note', note);
      formData.append('share_to_bonfire', sharing.toString());
      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('photo', { uri: image, name: filename, type } as any);
      }
      await api.post(`/quests/${questId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert(
        'Quest Conquered!',
        'You earned 50 XP! Your story has been added to the logbook.',
        [{ text: 'Onward!', onPress: () => navigation.navigate('HomeRoot') }]
      );
    } catch (error: any) {
      console.error('Completion failed', error);
      Alert.alert('Hmm...', error.response?.data?.detail || 'Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Trophy size={16} color={COLORS.xpGold} />
          <Text style={styles.headerTitle}>Finish Quest</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* XP Preview */}
        <View style={styles.xpPreview}>
          <LinearGradient
            colors={[COLORS.secondaryGlow, 'transparent']}
            style={styles.xpPreviewGlow}
          />
          <Trophy size={28} color={COLORS.xpGold} />
          <View>
            <Text style={styles.xpPreviewTitle}>+50 XP awaits!</Text>
            <Text style={styles.xpPreviewSub}>Add a photo to share your story at the Bonfire</Text>
          </View>
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <ImageIcon size={16} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>Capture the Moment</Text>
          </View>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {image ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                  <X color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraIconWrap}>
                  <Camera color={COLORS.textMuted} size={32} />
                </View>
                <Text style={styles.imagePlaceholderText}>Tap to add a photo</Text>
                <Text style={styles.imagePlaceholderHint}>Show the world what you found</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <PenLine size={16} color={COLORS.accent2} />
            <Text style={styles.sectionLabel}>Trail Notes</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="What did you discover? How did it feel? Any surprises?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Social Share */}
        <View style={styles.shareSection}>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>Share to Bonfire</Text>
            <Text style={styles.shareSub}>Let other wanderers see your story</Text>
          </View>
          <Switch
            value={sharing}
            onValueChange={setSharing}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '60' }}
            thumbColor={sharing ? COLORS.primary : COLORS.textMuted}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? [COLORS.surfaceLight, COLORS.surfaceLight] : [COLORS.accent, '#00B894']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textMuted} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Adventure</Text>
                <Send color="#fff" size={18} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

  // XP Preview
  xpPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 28, overflow: 'hidden',
  },
  xpPreviewGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  xpPreviewTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.xpGold },
  xpPreviewSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  // Section
  section: { marginBottom: 28 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 15 },
  optionalTag: {
    ...TYPOGRAPHY.tiny, color: COLORS.textMuted, fontSize: 9, textTransform: 'none',
    backgroundColor: COLORS.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },

  // Image Picker
  imagePicker: {
    width: '100%', aspectRatio: 4 / 3, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  cameraIconWrap: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, fontSize: 15 },
  imagePlaceholderHint: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 12 },
  imageWrapper: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, width: '100%', height: '100%' },
  removeImage: {
    position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20, padding: 6,
  },

  // Text Input
  textInput: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    color: COLORS.text, fontSize: 15, minHeight: 120, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border, lineHeight: 22,
  },

  // Submit
  submitButton: {
    borderRadius: 18, padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: { ...TYPOGRAPHY.buttonLarge, color: '#fff' },
  // Social Share
  shareSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 28,
  },
  shareInfo: { flex: 1, gap: 2 },
  shareTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 15 },
  shareSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11 },
});
