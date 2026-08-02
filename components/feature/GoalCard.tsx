import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
  completedSessionCount?: number;
  onPress?: () => void;
}

const AREA_COLORS: Record<string, string> = {
  work: '#3B82F6',
  projects: '#8B5CF6',
  personal_development: '#F59E0B',
  health: '#10B981',
  family: '#EC4899',
  // Onboarding life areas
  Work: '#3B82F6',
  Health: '#10B981',
  Learning: '#F59E0B',
  Relationships: '#EC4899',
  Finance: '#6366F1',
  Creative: '#8B5CF6',
};

const HORIZON_LABELS: Record<string, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

export function GoalCard({ goal, completedSessionCount = 0, onPress }: GoalCardProps) {
  const isScheduled = goal.linkedSessionIds.length > 0;
  const isCompleted = goal.status === 'completed';
  const areaColor = AREA_COLORS[goal.lifeArea] || Colors.primary;

  const totalSessions = goal.linkedSessionIds.length;
  const progress = totalSessions > 0 ? completedSessionCount / totalSessions : 0;
  const progressPct = Math.round(progress * 100);

  const borderColor = isCompleted
    ? Colors.textSubtle + '40'
    : isScheduled
    ? Colors.success + '50'
    : Colors.danger + '40';

  const accentColor = isCompleted
    ? Colors.textSubtle
    : isScheduled
    ? Colors.success
    : Colors.danger;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor, borderLeftColor: accentColor },
        isCompleted && styles.cardCompleted,
        pressed && onPress ? { opacity: 0.8 } : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: areaColor + '18' }]}>
            <Text style={[styles.badgeTxt, { color: areaColor }]}>
              {goal.lifeArea.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.surface }]}>
            <Text style={[styles.badgeTxt, { color: Colors.textSecondary }]}>
              {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
            </Text>
          </View>
          {isCompleted && (
            <View style={[styles.badge, { backgroundColor: Colors.success + '18' }]}>
              <MaterialIcons name="check-circle" size={10} color={Colors.success} />
              <Text style={[styles.badgeTxt, { color: Colors.success, marginLeft: 3 }]}>
                Done
              </Text>
            </View>
          )}
        </View>
        <MaterialIcons
          name="chevron-right"
          size={18}
          color={Colors.textSubtle}
          style={{ opacity: onPress ? 1 : 0 }}
        />
      </View>

      <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
        {goal.title}
      </Text>

      {goal.successMetric ? (
        <Text style={styles.metric} numberOfLines={2}>
          {goal.successMetric}
        </Text>
      ) : null}

      {/* Progress bar — only when sessions are linked */}
      {totalSessions > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.row}>
              <MaterialIcons
                name={isCompleted ? 'check-circle-outline' : 'event-available'}
                size={12}
                color={isCompleted ? Colors.success : accentColor}
              />
              <Text style={[styles.footTxt, { color: isCompleted ? Colors.success : accentColor }]}>
                {completedSessionCount}/{totalSessions} session{totalSessions !== 1 ? 's' : ''} complete
              </Text>
            </View>
            <Text style={[styles.pctTxt, { color: isCompleted ? Colors.success : accentColor }]}>
              {progressPct}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%` as any,
                  backgroundColor: isCompleted ? Colors.success : accentColor,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* No sessions — needs time placement */}
      {totalSessions === 0 && !isCompleted && (
        <View style={styles.footer}>
          <View style={styles.row}>
            <MaterialIcons name="schedule" size={12} color={Colors.danger} />
            <Text style={[styles.footTxt, { color: Colors.danger }]}>
              Needs time placement
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  cardCompleted: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badges: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeTxt: { ...Typography.micro, textTransform: 'capitalize' },
  title: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  titleCompleted: { textDecorationLine: 'line-through', color: Colors.textSubtle },
  metric: {
    ...Typography.small,
    color: Colors.textSubtle,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressSection: { marginTop: 8 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  pctTxt: { ...Typography.micro, fontWeight: '700' },
  footer: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footTxt: { ...Typography.micro },
});
