import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { Session } from '@/contexts/AppContext';

interface SessionCardProps {
  session: Session;
  personaColor: string;
  onComplete: () => void;
  onSnooze: () => void;
}

const CAT_COLORS: Record<string, string> = {
  morning: Colors.morning,
  midday: Colors.midday,
  evening: Colors.evening,
};

const TYPE_ICONS: Record<string, string> = {
  alarm: 'alarm',
  event: 'event',
  session: 'timer',
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SessionCard({
  session,
  personaColor,
  onComplete,
  onSnooze,
}: SessionCardProps) {
  const done = session.status === 'completed';
  const catColor = CAT_COLORS[session.category] || Colors.primary;

  return (
    <View style={[styles.card, done && styles.cardDim]}>
      <View style={[styles.accent, { backgroundColor: catColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.timeRow}>
            <MaterialIcons
              name={(TYPE_ICONS[session.type] || 'timer') as any}
              size={13}
              color={Colors.textSubtle}
            />
            <Text style={styles.time}>{fmtTime(session.scheduledAt)}</Text>
            {session.durationMinutes ? (
              <Text style={styles.dur}>{session.durationMinutes}m</Text>
            ) : null}
          </View>
          {done ? (
            <View style={styles.doneBadge}>
              <MaterialIcons name="check" size={11} color={Colors.success} />
              <Text style={styles.doneText}>Done</Text>
            </View>
          ) : session.snoozeCount > 0 ? (
            <View style={styles.snoozeBadge}>
              <Text style={styles.snoozeText}>z×{session.snoozeCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {session.title}
        </Text>

        {session.coachMessage ? (
          <Text style={styles.msg} numberOfLines={2}>
            {session.coachMessage}
          </Text>
        ) : null}

        {!done && (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { borderColor: Colors.success + '60' },
                pressed && { opacity: 0.65 },
              ]}
              onPress={onComplete}
              hitSlop={8}
            >
              <MaterialIcons name="check" size={13} color={Colors.success} />
              <Text style={[styles.btnTxt, { color: Colors.success }]}>
                Complete
              </Text>
            </Pressable>
            {session.snoozeCount < 3 && (
              <Pressable
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.65 }]}
                onPress={onSnooze}
                hitSlop={8}
              >
                <MaterialIcons name="snooze" size={13} color={Colors.textSubtle} />
                <Text style={styles.btnTxt}>Snooze</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardDim: { opacity: 0.55 },
  accent: { width: 4 },
  body: { flex: 1, padding: Spacing.md },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { ...Typography.smallBold, color: Colors.textSecondary },
  dur: { ...Typography.micro, color: Colors.textSubtle },
  title: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textSubtle },
  msg: { ...Typography.small, color: Colors.textSubtle, lineHeight: 18, marginBottom: 10 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  doneText: { ...Typography.micro, color: Colors.success },
  snoozeBadge: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  snoozeText: { ...Typography.micro, color: Colors.textSubtle },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnTxt: { ...Typography.micro, color: Colors.textSubtle },
});
