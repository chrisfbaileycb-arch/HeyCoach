import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
}

const AREA_COLORS: Record<string, string> = {
  work: '#3B82F6',
  projects: '#8B5CF6',
  personal_development: '#F59E0B',
  health: '#10B981',
  family: '#EC4899',
};

const HORIZON_LABELS: Record<string, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

export function GoalCard({ goal }: GoalCardProps) {
  const isScheduled = goal.linkedSessionIds.length > 0;
  const areaColor = AREA_COLORS[goal.lifeArea] || Colors.primary;

  return (
    <View
      style={[
        styles.card,
        isScheduled ? styles.cardScheduled : styles.cardUnscheduled,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <View
            style={[styles.badge, { backgroundColor: areaColor + '18' }]}
          >
            <Text style={[styles.badgeTxt, { color: areaColor }]}>
              {goal.lifeArea.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.surface }]}>
            <Text style={[styles.badgeTxt, { color: Colors.textSecondary }]}>
              {HORIZON_LABELS[goal.horizon]}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.dot,
            { backgroundColor: isScheduled ? Colors.success : Colors.danger },
          ]}
        />
      </View>

      <Text style={styles.title}>{goal.title}</Text>

      {goal.successMetric ? (
        <Text style={styles.metric}>{goal.successMetric}</Text>
      ) : null}

      <View style={styles.footer}>
        {isScheduled ? (
          <View style={styles.row}>
            <MaterialIcons
              name="event-available"
              size={12}
              color={Colors.success}
            />
            <Text style={[styles.footTxt, { color: Colors.success }]}>
              {goal.linkedSessionIds.length} session
              {goal.linkedSessionIds.length > 1 ? 's' : ''} scheduled
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <MaterialIcons
              name="schedule"
              size={12}
              color={Colors.danger}
            />
            <Text style={[styles.footTxt, { color: Colors.danger }]}>
              Needs time placement
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardScheduled: {
    borderColor: Colors.success + '30',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  cardUnscheduled: {
    borderColor: Colors.danger + '30',
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badges: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeTxt: { ...Typography.micro, textTransform: 'uppercase' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  title: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  metric: {
    ...Typography.small,
    color: Colors.textSubtle,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footTxt: { ...Typography.micro },
});
