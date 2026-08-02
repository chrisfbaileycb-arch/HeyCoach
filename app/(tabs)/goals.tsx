import React, { useState, useCallback, useMemo } from 'react';
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
import { GoalCard } from '@/components';
import type { Goal } from '@/types';

type FilterTab = 'all' | 'active' | 'completed';
type Horizon = 'day' | 'week' | 'month';
type LifeArea = string;

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'active', label: 'Active', icon: 'radio-button-unchecked' },
  { key: 'completed', label: 'Completed', icon: 'check-circle-outline' },
];

const HORIZONS: Horizon[] = ['day', 'week', 'month'];
const LIFE_AREAS: LifeArea[] = [
  'Work', 'Health', 'Learning', 'Relationships', 'Finance', 'Creative',
];

const AREA_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Health: '#10B981',
  Learning: '#F59E0B',
  Relationships: '#EC4899',
  Finance: '#6366F1',
  Creative: '#8B5CF6',
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

// ─── Goal Detail Sheet ────────────────────────────────────────────────────────
interface DetailSheetProps {
  goal: Goal;
  completedSessionCount: number;
  personaColor: string;
  onClose: () => void;
  onComplete: () => void;
}

function GoalDetailSheet({
  goal,
  completedSessionCount,
  personaColor,
  onClose,
  onComplete,
}: DetailSheetProps) {
  const isCompleted = goal.status === 'completed';
  const totalSessions = goal.linkedSessionIds.length;
  const progress = totalSessions > 0 ? completedSessionCount / totalSessions : 0;
  const progressPct = Math.round(progress * 100);
  const areaColor = AREA_COLORS[goal.lifeArea] || Colors.primary;

  return (
    <View style={ds.container}>
      {/* Handle */}
      <View style={ds.handle} />

      {/* Close */}
      <Pressable
        style={ds.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={20} color={Colors.textSubtle} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Badges */}
        <View style={ds.badges}>
          <View style={[ds.badge, { backgroundColor: areaColor + '18' }]}>
            <Text style={[ds.badgeTxt, { color: areaColor }]}>
              {goal.lifeArea.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={[ds.badge, { backgroundColor: Colors.surface }]}>
            <Text style={[ds.badgeTxt, { color: Colors.textSecondary }]}>
              {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
            </Text>
          </View>
          {isCompleted && (
            <View style={[ds.badge, { backgroundColor: Colors.success + '20' }]}>
              <MaterialIcons name="check-circle" size={11} color={Colors.success} />
              <Text style={[ds.badgeTxt, { color: Colors.success, marginLeft: 4 }]}>
                Completed
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[ds.title, isCompleted && ds.titleDone]}>{goal.title}</Text>

        {/* Success metric */}
        {goal.successMetric ? (
          <View style={ds.metricBox}>
            <MaterialIcons name="flag" size={13} color={Colors.textSubtle} />
            <Text style={ds.metricTxt}>{goal.successMetric}</Text>
          </View>
        ) : null}

        {/* Progress section */}
        <View style={ds.progressCard}>
          <View style={ds.progressHeader}>
            <Text style={ds.progressLabel}>Session Progress</Text>
            <Text style={[ds.progressPct, { color: isCompleted ? Colors.success : personaColor }]}>
              {progressPct}%
            </Text>
          </View>
          <View style={ds.progressTrack}>
            <View
              style={[
                ds.progressFill,
                {
                  width: `${progressPct}%` as any,
                  backgroundColor: isCompleted ? Colors.success : personaColor,
                },
              ]}
            />
          </View>
          <Text style={ds.progressSub}>
            {totalSessions === 0
              ? 'No calendar sessions linked yet'
              : `${completedSessionCount} of ${totalSessions} session${totalSessions !== 1 ? 's' : ''} complete`}
          </Text>
        </View>

        {/* Mark complete button */}
        {!isCompleted ? (
          <Pressable
            style={({ pressed }) => [
              ds.completeBtn,
              { backgroundColor: Colors.success, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onComplete}
          >
            <MaterialIcons name="check-circle-outline" size={18} color={Colors.textInverse} />
            <Text style={ds.completeBtnTxt}>Mark Goal Complete</Text>
          </Pressable>
        ) : (
          <View style={ds.doneRow}>
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
            <Text style={ds.doneTxt}>This goal has been completed</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Goals Screen ────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, sessions, addGoal, completeGoal, activePersonaId } = useApp();
  const persona = getPersonaById(activePersonaId);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Add goal form state
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('');
  const [horizon, setHorizon] = useState<Horizon>('week');
  const [lifeArea, setLifeArea] = useState<LifeArea>('Work');

  // Compute completed session count per goal
  const completedCountByGoalId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const goal of goals) {
      const count = goal.linkedSessionIds.filter((sid) => {
        const s = sessions.find((sess) => sess.id === sid);
        return s?.status === 'completed';
      }).length;
      map[goal.id] = count;
    }
    return map;
  }, [goals, sessions]);

  // Selected goal for detail sheet
  const selectedGoal = selectedGoalId
    ? goals.find((g) => g.id === selectedGoalId) ?? null
    : null;

  // Derived lists
  const active = goals.filter((g) => g.status !== 'completed');
  const completed = goals.filter((g) => g.status === 'completed');
  const needsTime = active.filter((g) => g.linkedSessionIds.length === 0);
  const scheduled = active.filter((g) => g.linkedSessionIds.length > 0);

  const filtered =
    filter === 'active' ? active : filter === 'completed' ? completed : goals;

  const headerSub =
    filter === 'completed'
      ? `${completed.length} goal${completed.length !== 1 ? 's' : ''} completed`
      : needsTime.length > 0
      ? `${needsTime.length} need${needsTime.length === 1 ? 's' : ''} time placement`
      : 'All active goals are scheduled';

  const handleAdd = () => {
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      lifeArea,
      horizon,
      successMetric: metric.trim() || undefined,
    });
    setTitle('');
    setMetric('');
    setHorizon('week');
    setLifeArea('Work');
    setModalVisible(false);
  };

  const handleComplete = (goalId: string) => {
    completeGoal(goalId);
    setSelectedGoalId(null);
  };

  const renderGoalCard = (g: Goal) => (
    <GoalCard
      key={g.id}
      goal={g}
      completedSessionCount={completedCountByGoalId[g.id] ?? 0}
      onPress={() => setSelectedGoalId(g.id)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.sub}>{headerSub}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: persona.color, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>

      {/* ── Filter Tabs ─────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? goals.length
              : tab.key === 'active'
              ? active.length
              : completed.length;
          const isActive = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                isActive && { borderBottomColor: persona.color, borderBottomWidth: 2 },
              ]}
              onPress={() => setFilter(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={14}
                color={isActive ? persona.color : Colors.textSubtle}
              />
              <Text style={[styles.tabTxt, isActive && { color: persona.color }]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  isActive
                    ? { backgroundColor: persona.color }
                    : { backgroundColor: Colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeTxt,
                    isActive ? { color: Colors.textInverse } : { color: Colors.textSubtle },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── List ────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {filter === 'completed' ? '🏆' : '🎯'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'completed' ? 'No completed goals yet' : 'No goals here'}
            </Text>
            <Text style={styles.emptyMsg}>
              {filter === 'completed'
                ? 'Mark a goal complete from its detail sheet.'
                : 'Add a goal and give it a calendar block.'}
            </Text>
          </View>
        )}

        {/* All tab — show sub-sections */}
        {filter === 'all' && goals.length > 0 && (
          <>
            {needsTime.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <View style={[styles.sectionDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.sectionLabel}>Needs Time Placement</Text>
                  <Text style={styles.sectionCount}>{needsTime.length}</Text>
                </View>
                {needsTime.map(renderGoalCard)}
              </>
            )}
            {scheduled.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <View style={[styles.sectionDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.sectionLabel}>In Progress</Text>
                  <Text style={styles.sectionCount}>{scheduled.length}</Text>
                </View>
                {scheduled.map(renderGoalCard)}
              </>
            )}
            {completed.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <View style={[styles.sectionDot, { backgroundColor: Colors.textSubtle }]} />
                  <Text style={styles.sectionLabel}>Completed</Text>
                  <Text style={styles.sectionCount}>{completed.length}</Text>
                </View>
                {completed.map(renderGoalCard)}
              </>
            )}
          </>
        )}

        {/* Active / Completed tabs — flat list */}
        {filter !== 'all' && filtered.map(renderGoalCard)}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Goal Detail Sheet ────────────────────────────────────────── */}
      <Modal
        visible={!!selectedGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGoalId(null)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedGoalId(null)} />
          {selectedGoal && (
            <GoalDetailSheet
              goal={selectedGoal}
              completedSessionCount={completedCountByGoalId[selectedGoal.id] ?? 0}
              personaColor={persona.color}
              onClose={() => setSelectedGoalId(null)}
              onComplete={() => handleComplete(selectedGoal.id)}
            />
          )}
        </View>
      </Modal>

      {/* ── Add Goal Modal ───────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>New Goal</Text>

              <TextInput
                style={styles.input}
                placeholder="Goal title..."
                placeholderTextColor={Colors.textSubtle}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />

              <TextInput
                style={[styles.input, { height: 72 }]}
                placeholder="Success metric — what proves this is done?"
                placeholderTextColor={Colors.textSubtle}
                value={metric}
                onChangeText={setMetric}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLbl}>Time Horizon</Text>
              <View style={styles.optRow}>
                {HORIZONS.map((hz) => (
                  <Pressable
                    key={hz}
                    style={({ pressed }) => [
                      styles.optBtn,
                      horizon === hz && {
                        backgroundColor: persona.color + '20',
                        borderColor: persona.color,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setHorizon(hz)}
                  >
                    <Text
                      style={[
                        styles.optTxt,
                        horizon === hz && { color: persona.color },
                      ]}
                    >
                      {hz.charAt(0).toUpperCase() + hz.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLbl}>Life Area</Text>
              <View style={styles.areaGrid}>
                {LIFE_AREAS.map((a) => (
                  <Pressable
                    key={a}
                    style={({ pressed }) => [
                      styles.areaBtn,
                      lifeArea === a && {
                        backgroundColor: (AREA_COLORS[a] || Colors.primary) + '20',
                        borderColor: AREA_COLORS[a] || Colors.primary,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setLifeArea(a)}
                  >
                    <Text
                      style={[
                        styles.areaTxt,
                        lifeArea === a && { color: AREA_COLORS[a] || Colors.primary },
                      ]}
                    >
                      {a}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: persona.color, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleAdd}
              >
                <Text style={styles.submitTxt}>Save Goal</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.text },
  sub: { ...Typography.small, color: Colors.textSubtle, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter tabs (underline style)
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabTxt: { ...Typography.smallBold, color: Colors.textSubtle },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeTxt: { fontSize: 10, fontWeight: '700' },

  list: { flex: 1 },
  listContent: { padding: Spacing.md },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionDot: { width: 7, height: 7, borderRadius: 3.5 },
  sectionLabel: { ...Typography.smallBold, color: Colors.textSecondary, flex: 1 },
  sectionCount: {
    ...Typography.micro,
    color: Colors.textSubtle,
    fontWeight: '700',
    backgroundColor: Colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptyMsg: { ...Typography.small, color: Colors.textSubtle, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
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
    marginBottom: Spacing.sm,
  },
  fieldLbl: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  optRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  optBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  optTxt: { ...Typography.smallBold, color: Colors.textSecondary },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  areaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  areaTxt: { ...Typography.small, color: Colors.textSecondary },
  submitBtn: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitTxt: { ...Typography.bodyBold, color: Colors.textInverse },
});

// ─── Detail Sheet Styles ─────────────────────────────────────────────────────
const ds = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeTxt: { ...Typography.micro, textTransform: 'capitalize', fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textSubtle },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricTxt: {
    ...Typography.small,
    color: Colors.textSubtle,
    lineHeight: 18,
    flex: 1,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { ...Typography.smallBold, color: Colors.textSecondary },
  progressPct: { ...Typography.h2, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  progressSub: { ...Typography.small, color: Colors.textSubtle },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 15,
  },
  completeBtnTxt: { ...Typography.bodyBold, color: Colors.textInverse },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: Colors.success + '12',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  doneTxt: { ...Typography.smallBold, color: Colors.success },
});
