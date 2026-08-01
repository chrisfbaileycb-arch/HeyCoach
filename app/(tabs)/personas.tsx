import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import {
  PERSONAS,
  getPersonaById,
  INTENSITY_LABELS,
  INTENSITY_DESCS,
} from '@/constants/personas';
import { PersonaCard } from '@/components';

const EMOJI: Record<string, string> = {
  military_tech: '⚡',
  sports: '🏆',
  code: '🚀',
  spa: '🌿',
};

export default function PersonasScreen() {
  const insets = useSafeAreaInsets();
  const { activePersonaId, intensity, setActivePersona, setIntensity } =
    useApp();
  const { signOut } = useAuth();
  const persona = getPersonaById(activePersonaId);

  const sampleMsg = useMemo(
    () => persona.startSession('your focus block', intensity),
    [persona, intensity]
  );

  const emoji = EMOJI[persona.iconName] || '🏆';

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Your Coach</Text>
      <Text style={styles.pageSub}>
        Choose style and intensity. Every message adapts.
      </Text>

      {/* Sign Out */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={signOut}
      >
        <MaterialIcons name="logout" size={15} color={Colors.textSubtle} />
        <Text style={styles.signOutTxt}>Sign Out</Text>
      </Pressable>

      {/* Active Persona Summary */}
      <View
        style={[
          styles.activeCard,
          {
            borderColor: persona.color + '55',
            backgroundColor: persona.bgColor,
          },
        ]}
      >
        <View style={styles.activeLeft}>
          <Text style={[styles.activeName, { color: persona.color }]}>
            {persona.name}
          </Text>
          <Text style={styles.activeTone}>{persona.tone}</Text>
          <View
            style={[
              styles.activeBadge,
              { backgroundColor: persona.color + '25' },
            ]}
          >
            <Text style={[styles.activeBadgeTxt, { color: persona.color }]}>
              Intensity {intensity} · {INTENSITY_LABELS[intensity]}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.activeIconWrap,
            { backgroundColor: persona.color + '22' },
          ]}
        >
          <Text style={styles.activeEmoji}>{emoji}</Text>
        </View>
      </View>

      {/* Choose Coach */}
      <Text style={styles.sectionLbl}>CHOOSE YOUR COACH</Text>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {PERSONAS.slice(0, 2).map(p => (
            <View key={p.id} style={styles.gridCell}>
              <PersonaCard
                persona={p}
                isActive={activePersonaId === p.id}
                onSelect={() => setActivePersona(p.id)}
              />
            </View>
          ))}
        </View>
        <View style={styles.gridRow}>
          {PERSONAS.slice(2, 4).map(p => (
            <View key={p.id} style={styles.gridCell}>
              <PersonaCard
                persona={p}
                isActive={activePersonaId === p.id}
                onSelect={() => setActivePersona(p.id)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Intensity */}
      <Text style={styles.sectionLbl}>COACHING INTENSITY</Text>
      <View style={styles.intensityCard}>
        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map(level => (
            <Pressable
              key={level}
              style={({ pressed }) => [
                styles.intensityDot,
                level <= intensity && {
                  backgroundColor: persona.color,
                  borderColor: persona.color,
                },
                pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] },
              ]}
              onPress={() => setIntensity(level)}
            >
              <Text
                style={[
                  styles.intensityNum,
                  level <= intensity
                    ? { color: Colors.background }
                    : { color: Colors.textSubtle },
                ]}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.intensityLevel, { color: persona.color }]}>
          {INTENSITY_LABELS[intensity] ?? 'Firm'}
        </Text>
        <Text style={styles.intensityDesc}>
          {INTENSITY_DESCS[intensity] ?? ''}
        </Text>
      </View>

      {/* Sample Message */}
      <Text style={styles.sectionLbl}>HOW THIS SOUNDS</Text>
      <View
        style={[styles.sampleCard, { borderLeftColor: persona.color }]}
      >
        <View style={styles.sampleHeader}>
          <MaterialIcons
            name={persona.iconName as any}
            size={14}
            color={persona.color}
          />
          <Text style={[styles.sampleLbl, { color: persona.color }]}>
            {persona.name} · Intensity {intensity}
          </Text>
        </View>
        <Text style={styles.sampleTxt}>"{sampleMsg}"</Text>
      </View>

      {/* All Personas Table */}
      <Text style={styles.sectionLbl}>COMPARE STYLES</Text>
      {PERSONAS.map(p => (
        <Pressable
          key={p.id}
          style={({ pressed }) => [
            styles.compareRow,
            activePersonaId === p.id && {
              borderColor: p.color + '55',
              backgroundColor: p.bgColor,
            },
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => setActivePersona(p.id)}
        >
          <View
            style={[styles.compareIcon, { backgroundColor: p.color + '20' }]}
          >
            <MaterialIcons name={p.iconName as any} size={18} color={p.color} />
          </View>
          <View style={styles.compareInfo}>
            <Text style={[styles.compareName, { color: p.color }]}>
              {p.name}
            </Text>
            <Text style={styles.compareTone}>{p.tone}</Text>
          </View>
          {activePersonaId === p.id && (
            <MaterialIcons name="check" size={18} color={p.color} />
          )}
        </Pressable>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },

  pageTitle: { ...Typography.hero, color: Colors.text },
  pageSub: {
    ...Typography.small,
    color: Colors.textSubtle,
    marginTop: 4,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },

  activeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  activeLeft: { flex: 1 },
  activeName: { ...Typography.h1, marginBottom: 4 },
  activeTone: {
    ...Typography.small,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  activeBadgeTxt: { ...Typography.micro },
  activeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  activeEmoji: { fontSize: 26 },

  sectionLbl: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  grid: { gap: Spacing.sm, marginBottom: Spacing.md },
  gridRow: { flexDirection: 'row', gap: Spacing.sm },
  gridCell: { flex: 1 },

  intensityCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  intensityDot: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityNum: { ...Typography.bodyBold },
  intensityLevel: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: 4,
  },
  intensityDesc: {
    ...Typography.small,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },

  sampleCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.sm,
  },
  sampleLbl: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 0.5 },
  sampleTxt: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compareIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareInfo: { flex: 1 },
  compareName: { ...Typography.smallBold, marginBottom: 2 },
  compareTone: { ...Typography.micro, color: Colors.textSubtle },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  signOutTxt: { ...Typography.micro, color: Colors.textSubtle },
});
