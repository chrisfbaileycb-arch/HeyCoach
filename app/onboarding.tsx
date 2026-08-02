import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import {
  PERSONAS,
  INTENSITY_LABELS,
  INTENSITY_DESCS,
  getPersonaById,
} from '@/constants/personas';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ProfileService from '@/services/profileService';
import * as GoalService from '@/services/goalService';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 3;

// ─── Life areas & horizons ────────────────────────────────────────────────────
const LIFE_AREAS = [
  { label: 'Health', icon: 'favorite' },
  { label: 'Work', icon: 'work' },
  { label: 'Learning', icon: 'school' },
  { label: 'Relationships', icon: 'people' },
  { label: 'Finance', icon: 'trending-up' },
  { label: 'Creative', icon: 'brush' },
];

const HORIZONS = [
  { label: 'Today', value: 'day', icon: 'today' },
  { label: 'This Week', value: 'week', icon: 'date-range' },
  { label: 'This Month', value: 'month', icon: 'calendar-month' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <View style={dots.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            dots.dot,
            i === current
              ? dots.dotActive
              : i < current
              ? dots.dotDone
              : dots.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Screen 1 — Pick Persona ──────────────────────────────────────────────────
interface Screen1Props {
  selectedPersonaId: string;
  onSelect: (id: string) => void;
}

function PickPersonaScreen({ selectedPersonaId, onSelect }: Screen1Props) {
  return (
    <View style={s1.container}>
      <View style={s1.textBlock}>
        <Text style={s1.kicker}>STEP 1 OF 3</Text>
        <Text style={s1.heading}>Choose your coach</Text>
        <Text style={s1.sub}>
          Each coach has a distinct style. Pick the one that fits how you want
          to be held accountable.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s1.list}
      >
        {PERSONAS.map((p) => {
          const selected = p.id === selectedPersonaId;
          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [
                s1.card,
                selected && { borderColor: p.color, backgroundColor: p.color + '12' },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => onSelect(p.id)}
            >
              {/* Color stripe */}
              <View style={[s1.stripe, { backgroundColor: p.color }]} />

              <View style={s1.cardInner}>
                {/* Icon + name row */}
                <View style={s1.cardTop}>
                  <View
                    style={[
                      s1.iconWrap,
                      { backgroundColor: p.color + '20' },
                    ]}
                  >
                    <MaterialIcons
                      name={p.iconName as any}
                      size={20}
                      color={p.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s1.cardName}>{p.name}</Text>
                    <Text style={s1.cardSub}>{p.subtitle}</Text>
                  </View>
                  {selected && (
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={p.color}
                    />
                  )}
                </View>

                {/* Example greeting */}
                <Text style={s1.cardGreeting} numberOfLines={2}>
                  "{p.greeting(p.defaultIntensity)}"
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Screen 2 — Set Intensity ─────────────────────────────────────────────────
interface Screen2Props {
  personaId: string;
  intensity: number;
  onIntensityChange: (v: number) => void;
}

function SetIntensityScreen({ personaId, intensity, onIntensityChange }: Screen2Props) {
  const persona = getPersonaById(personaId);
  const exampleMsg = persona.greeting(intensity);

  return (
    <View style={s2.container}>
      <View style={s2.textBlock}>
        <Text style={s2.kicker}>STEP 2 OF 3</Text>
        <Text style={s2.heading}>Set your intensity</Text>
        <Text style={s2.sub}>
          Dial in how hard {persona.name} pushes you. You can change this any
          time in the Coach tab.
        </Text>
      </View>

      {/* Level buttons */}
      <View style={s2.levelsRow}>
        {[1, 2, 3, 4, 5].map((lvl) => {
          const active = lvl === intensity;
          return (
            <Pressable
              key={lvl}
              style={({ pressed }) => [
                s2.lvlBtn,
                active && {
                  backgroundColor: persona.color,
                  borderColor: persona.color,
                },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => onIntensityChange(lvl)}
            >
              <Text
                style={[s2.lvlNum, active && { color: Colors.textInverse }]}
              >
                {lvl}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Label + description */}
      <View
        style={[
          s2.descCard,
          { borderColor: persona.color + '40', backgroundColor: persona.color + '0C' },
        ]}
      >
        <Text style={[s2.descLabel, { color: persona.color }]}>
          {INTENSITY_LABELS[intensity]?.toUpperCase()}
        </Text>
        <Text style={s2.descText}>{INTENSITY_DESCS[intensity]}</Text>
      </View>

      {/* Live preview */}
      <View style={s2.previewCard}>
        <View style={s2.previewHeader}>
          <View
            style={[s2.previewIconWrap, { backgroundColor: persona.color + '20' }]}
          >
            <MaterialIcons
              name={persona.iconName as any}
              size={14}
              color={persona.color}
            />
          </View>
          <Text style={[s2.previewLabel, { color: persona.color }]}>
            LIVE PREVIEW · {persona.name}
          </Text>
        </View>
        <Text style={s2.previewMsg}>"{exampleMsg}"</Text>
      </View>
    </View>
  );
}

// ─── Screen 3 — First Goal ────────────────────────────────────────────────────
interface Screen3Props {
  goalTitle: string;
  lifeArea: string;
  horizon: string;
  onTitleChange: (v: string) => void;
  onAreaChange: (v: string) => void;
  onHorizonChange: (v: string) => void;
}

function FirstGoalScreen({
  goalTitle,
  lifeArea,
  horizon,
  onTitleChange,
  onAreaChange,
  onHorizonChange,
}: Screen3Props) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s3.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s3.textBlock}>
          <Text style={s3.kicker}>STEP 3 OF 3</Text>
          <Text style={s3.heading}>Your first goal</Text>
          <Text style={s3.sub}>
            Give your coach something to work with. One clear goal to start.
          </Text>
        </View>

        {/* Goal title */}
        <Text style={s3.label}>WHAT DO YOU WANT TO ACHIEVE?</Text>
        <TextInput
          style={s3.input}
          placeholder="e.g. Ship the MVP by end of month"
          placeholderTextColor={Colors.textSubtle}
          value={goalTitle}
          onChangeText={onTitleChange}
          multiline
          numberOfLines={2}
          maxLength={120}
        />

        {/* Life area */}
        <Text style={s3.label}>LIFE AREA</Text>
        <View style={s3.chipGrid}>
          {LIFE_AREAS.map(({ label, icon }) => {
            const active = lifeArea === label;
            return (
              <Pressable
                key={label}
                style={[s3.chip, active && s3.chipActive]}
                onPress={() => onAreaChange(label)}
              >
                <MaterialIcons
                  name={icon as any}
                  size={13}
                  color={active ? Colors.primary : Colors.textSubtle}
                />
                <Text style={[s3.chipTxt, active && s3.chipTxtActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Horizon */}
        <Text style={s3.label}>TIME HORIZON</Text>
        <View style={s3.horizonRow}>
          {HORIZONS.map(({ label, value, icon }) => {
            const active = horizon === value;
            return (
              <Pressable
                key={value}
                style={[s3.horizonBtn, active && s3.horizonBtnActive]}
                onPress={() => onHorizonChange(value)}
              >
                <MaterialIcons
                  name={icon as any}
                  size={16}
                  color={active ? Colors.primary : Colors.textSubtle}
                />
                <Text
                  style={[s3.horizonTxt, active && s3.horizonTxtActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Onboarding Screen ───────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { setActivePersona, setIntensity, addGoal } = useApp();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 1 state
  const [personaId, setPersonaId] = useState('coach_core');
  // Step 2 state
  const [intensity, setIntensityLocal] = useState(3);
  // Step 3 state
  const [goalTitle, setGoalTitle] = useState('');
  const [lifeArea, setLifeArea] = useState('Work');
  const [horizon, setHorizon] = useState('week');

  const persona = getPersonaById(personaId);

  const animateTo = (nextStep: number) => {
    const dir = nextStep > step ? -1 : 1;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: dir * 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-dir * 30);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePersonaSelect = useCallback(
    (id: string) => {
      setPersonaId(id);
      // Auto-set intensity to persona default
      const p = getPersonaById(id);
      setIntensityLocal(p.defaultIntensity);
    },
    []
  );

  const canAdvance = () => {
    if (step === 0) return true; // persona always selected
    if (step === 1) return true; // intensity always 1-5
    if (step === 2) return goalTitle.trim().length > 0 && !!lifeArea && !!horizon;
    return false;
  };

  const handleBack = () => {
    if (step > 0) animateTo(step - 1);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTo(step + 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Save persona + intensity to profile
      setActivePersona(personaId);
      setIntensity(intensity);
      await ProfileService.updateProfile(user.id, {
        activePersonaId: personaId,
        intensity,
      });

      // 2. Save first goal if provided
      if (goalTitle.trim()) {
        await addGoal({
          title: goalTitle.trim(),
          lifeArea,
          horizon: horizon as 'day' | 'week' | 'month',
          successMetric: undefined,
        });
      }

      // 3. Mark onboarding complete in AsyncStorage
      await AsyncStorage.setItem(`onboarding_done_${user.id}`, '1');

      // 4. Navigate to tabs
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[Onboarding] save failed:', err);
      // Still navigate even if save partially fails
      await AsyncStorage.setItem(`onboarding_done_${user.id}`, '1');
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;
  const canProceed = canAdvance();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <StepDots current={step} />
        <View style={{ width: 40 }} />
      </View>

      {/* ── Animated content ────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
            opacity: slideAnim.interpolate({
              inputRange: [-40, 0, 40],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
      >
        {step === 0 && (
          <PickPersonaScreen
            selectedPersonaId={personaId}
            onSelect={handlePersonaSelect}
          />
        )}
        {step === 1 && (
          <SetIntensityScreen
            personaId={personaId}
            intensity={intensity}
            onIntensityChange={setIntensityLocal}
          />
        )}
        {step === 2 && (
          <FirstGoalScreen
            goalTitle={goalTitle}
            lifeArea={lifeArea}
            horizon={horizon}
            onTitleChange={setGoalTitle}
            onAreaChange={setLifeArea}
            onHorizonChange={setHorizon}
          />
        )}
      </Animated.View>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {isLastStep ? (
          <View style={styles.footerCol}>
            {goalTitle.trim() === '' && (
              <Pressable
                style={styles.skipLink}
                onPress={async () => {
                  // Skip goal creation, finish onboarding
                  if (!user) return;
                  setSaving(true);
                  try {
                    setActivePersona(personaId);
                    setIntensity(intensity);
                    await ProfileService.updateProfile(user.id, {
                      activePersonaId: personaId,
                      intensity,
                    });
                    await AsyncStorage.setItem(`onboarding_done_${user.id}`, '1');
                    router.replace('/(tabs)');
                  } catch {
                    await AsyncStorage.setItem(`onboarding_done_${user.id}`, '1');
                    router.replace('/(tabs)');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Text style={styles.skipTxt}>Skip for now</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.ctaBtn,
                { backgroundColor: persona.color },
                (!canProceed || saving) && styles.ctaBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleFinish}
              disabled={!canProceed || saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <>
                  <MaterialIcons
                    name="check-circle-outline"
                    size={18}
                    color={Colors.textInverse}
                  />
                  <Text style={styles.ctaTxt}>Start coaching</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: persona.color },
              !canProceed && styles.ctaBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={styles.ctaTxt}>Continue</Text>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={Colors.textInverse}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  footerCol: { gap: Spacing.sm },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    minHeight: 56,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.border,
  },
  ctaTxt: {
    ...Typography.bodyBold,
    color: Colors.textInverse,
    fontSize: 17,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipTxt: {
    ...Typography.small,
    color: Colors.textSubtle,
    textDecorationLine: 'underline',
  },
});

// ─── Step dots ────────────────────────────────────────────────────────────────
const dots = StyleSheet.create({
  row: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotInactive: { width: 8 },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotDone: { width: 8, backgroundColor: Colors.textSubtle },
});

// ─── Screen 1 styles ──────────────────────────────────────────────────────────
const s1 = StyleSheet.create({
  container: { flex: 1 },
  textBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  kicker: {
    ...Typography.micro,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heading: { ...Typography.hero, color: Colors.text, marginBottom: 8 },
  sub: {
    ...Typography.body,
    color: Colors.textSubtle,
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stripe: { width: 4 },
  cardInner: { flex: 1, padding: Spacing.md, gap: 8 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { ...Typography.bodyBold, color: Colors.text },
  cardSub: { ...Typography.small, color: Colors.textSubtle, marginTop: 1 },
  cardGreeting: {
    ...Typography.small,
    color: Colors.textSubtle,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

// ─── Screen 2 styles ──────────────────────────────────────────────────────────
const s2 = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  textBlock: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  kicker: {
    ...Typography.micro,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heading: { ...Typography.hero, color: Colors.text, marginBottom: 8 },
  sub: { ...Typography.body, color: Colors.textSubtle, lineHeight: 22 },
  levelsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  lvlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  lvlNum: { ...Typography.h2, color: Colors.textSubtle },
  descCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  descLabel: {
    ...Typography.micro,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  descText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    ...Typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
  },
  previewMsg: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

// ─── Screen 3 styles ──────────────────────────────────────────────────────────
const s3 = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  textBlock: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  kicker: {
    ...Typography.micro,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heading: { ...Typography.hero, color: Colors.text, marginBottom: 8 },
  sub: { ...Typography.body, color: Colors.textSubtle, lineHeight: 22 },
  label: {
    ...Typography.micro,
    color: Colors.textSubtle,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '18',
  },
  chipTxt: { ...Typography.small, color: Colors.textSubtle },
  chipTxtActive: { color: Colors.primary, fontWeight: '600' },
  horizonRow: { flexDirection: 'row', gap: Spacing.sm },
  horizonBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 5,
  },
  horizonBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '18',
  },
  horizonTxt: { ...Typography.small, color: Colors.textSubtle },
  horizonTxtActive: { color: Colors.primary, fontWeight: '600' },
});
