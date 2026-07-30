import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { getPersonaById } from '@/constants/personas';
import { SessionCard } from '@/components';

const EMOJI: Record<string, string> = {
  military_tech: '⚡',
  sports: '🏆',
  code: '🚀',
  spa: '🌿',
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const {
    getTodaySessions,
    getTodayStats,
    getGreeting,
    activePersonaId,
    intensity,
    completeSession,
    snoozeSession,
    addSession,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);

  const persona = getPersonaById(activePersonaId);
  const todaySessions = getTodaySessions();
  const stats = getTodayStats();
  const progress = stats.total > 0 ? stats.completed / stats.total : 0;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const when = new Date(Date.now() + 3600000);
    when.setMinutes(0, 0, 0);
    const hour = when.getHours();
    addSession({
      title: newTitle.trim(),
      scheduledAt: when.toISOString(),
      category: hour < 12 ? 'morning' : hour < 17 ? 'midday' : 'evening',
      type: 'session',
      coachMessage: persona.startSession(newTitle.trim(), intensity),
      durationMinutes: 60,
    });
    setNewTitle('');
    setModalVisible(false);
  };

  const emoji = EMOJI[persona.iconName] || '🏆';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.dateLabel}>{dateStr}</Text>
              <Text style={styles.appTitle}>Hey Coach</Text>
            </View>
            <View
              style={[
                styles.personaBadge,
                {
                  backgroundColor: persona.color + '18',
                  borderColor: persona.color + '35',
                },
              ]}
            >
              <MaterialIcons
                name={persona.iconName as any}
                size={13}
                color={persona.color}
              />
              <Text
                style={[styles.personaBadgeTxt, { color: persona.color }]}
              >
                {persona.name}
              </Text>
            </View>
          </View>

          <View
            style={[styles.greetCard, { borderLeftColor: persona.color }]}
          >
            <Text style={styles.greetEmoji}>{emoji}</Text>
            <Text style={styles.greetText}>{getGreeting()}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Day Progress</Text>
            <Text
              style={[styles.progressFraction, { color: persona.color }]}
            >
              {stats.completed}/{stats.total}
            </Text>
          </View>
          <View
            style={styles.progressTrack}
            onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: trackWidth * progress,
                  backgroundColor: persona.color,
                },
              ]}
            />
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Scheduled', value: stats.total, icon: 'calendar-today' },
              { label: 'Completed', value: stats.completed, icon: 'check-circle-outline' },
              { label: 'Pending', value: stats.pending, icon: 'pending-actions' },
              {
                label: 'No Time',
                value: stats.goalsNeedingTime,
                icon: 'warning-amber',
                alert: stats.goalsNeedingTime > 0,
              },
            ].map(stat => (
              <View key={stat.label} style={styles.statCell}>
                <MaterialIcons
                  name={stat.icon as any}
                  size={16}
                  color={stat.alert ? Colors.danger : Colors.textSubtle}
                />
                <Text
                  style={[
                    styles.statValue,
                    stat.alert ? { color: Colors.danger } : {},
                  ]}
                >
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Agenda */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Agenda</Text>
          <Pressable
            style={({ pressed }) => [
              styles.addSessionBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add" size={15} color={persona.color} />
            <Text
              style={[styles.addSessionTxt, { color: persona.color }]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        {todaySessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No sessions today</Text>
            <Text style={styles.emptyMsg}>
              {persona.idleMessage(intensity)}
            </Text>
          </View>
        ) : (
          todaySessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              personaColor={persona.color}
              onComplete={() => completeSession(session.id)}
              onSnooze={() => snoozeSession(session.id)}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Session Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Add Session</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you working on?"
                placeholderTextColor={Colors.textSubtle}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: persona.color, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleAdd}
              >
                <Text style={styles.submitTxt}>Create Session</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },

  headerWrap: { marginBottom: Spacing.md },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dateLabel: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  appTitle: { ...Typography.hero, color: Colors.text, marginTop: 2 },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  personaBadgeTxt: { ...Typography.micro },
  greetCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greetEmoji: { fontSize: 20 },
  greetText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },

  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: { ...Typography.smallBold, color: Colors.textSecondary },
  progressFraction: { ...Typography.smallBold },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statCell: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h2, color: Colors.text },
  statLabel: { ...Typography.micro, color: Colors.textSubtle },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h2, color: Colors.text },
  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addSessionTxt: { ...Typography.smallBold },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptyMsg: {
    ...Typography.small,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
  },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  submitBtn: { borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  submitTxt: { ...Typography.bodyBold, color: Colors.textInverse },
});
