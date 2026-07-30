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
import { GoalCard } from '@/components';

type Filter = 'all' | 'needs_time' | 'scheduled';
type Horizon = 'day' | 'week' | 'month';
type LifeArea = 'work' | 'projects' | 'personal_development' | 'health' | 'family';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_time', label: 'Needs Time' },
  { key: 'scheduled', label: 'Scheduled' },
];
const HORIZONS: Horizon[] = ['day', 'week', 'month'];
const LIFE_AREAS: LifeArea[] = [
  'work', 'projects', 'personal_development', 'health', 'family',
];

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, addGoal, activePersonaId } = useApp();
  const persona = getPersonaById(activePersonaId);

  const [filter, setFilter] = useState<Filter>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('');
  const [horizon, setHorizon] = useState<Horizon>('week');
  const [lifeArea, setLifeArea] = useState<LifeArea>('work');

  const needsTime = goals.filter(
    g => g.linkedSessionIds.length === 0 && g.status !== 'completed'
  );
  const scheduled = goals.filter(g => g.linkedSessionIds.length > 0);

  const filtered =
    filter === 'needs_time'
      ? needsTime
      : filter === 'scheduled'
      ? scheduled
      : goals;

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
    setLifeArea('work');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.sub}>
            {needsTime.length > 0
              ? `${needsTime.length} need time placement`
              : 'All goals are scheduled'}
          </Text>
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

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={({ pressed }) => [
              styles.chip,
              filter === f.key && [
                styles.chipActive,
                { backgroundColor: persona.color },
              ],
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.chipTxt,
                filter === f.key && styles.chipTxtActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals here</Text>
            <Text style={styles.emptyMsg}>
              Add a goal and give it a calendar block.
            </Text>
          </View>
        )}

        {filter === 'all' && (
          <>
            {needsTime.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: Colors.danger },
                    ]}
                  />
                  <Text style={styles.sectionLabel}>Needs Time Placement</Text>
                </View>
                {needsTime.map(g => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </>
            )}
            {scheduled.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: Colors.success },
                    ]}
                  />
                  <Text style={styles.sectionLabel}>Scheduled</Text>
                </View>
                {scheduled.map(g => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </>
            )}
          </>
        )}

        {filter !== 'all' &&
          filtered.map(g => <GoalCard key={g.id} goal={g} />)}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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

              <Text style={styles.fieldLbl}>Horizon</Text>
              <View style={styles.optRow}>
                {HORIZONS.map(hz => (
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
                {LIFE_AREAS.map(a => (
                  <Pressable
                    key={a}
                    style={({ pressed }) => [
                      styles.areaBtn,
                      lifeArea === a && {
                        backgroundColor: persona.color + '20',
                        borderColor: persona.color,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setLifeArea(a)}
                  >
                    <Text
                      style={[
                        styles.areaTxt,
                        lifeArea === a && { color: persona.color },
                      ]}
                    >
                      {a.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: persona.color,
                    opacity: pressed ? 0.85 : 1,
                  },
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
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
  filterBar: { maxHeight: 52 },
  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { borderColor: 'transparent' },
  chipTxt: { ...Typography.smallBold, color: Colors.textSecondary },
  chipTxtActive: { color: Colors.textInverse },
  list: { flex: 1 },
  listContent: { padding: Spacing.md },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { ...Typography.smallBold, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  areaTxt: { ...Typography.micro, color: Colors.textSecondary, textTransform: 'capitalize' },
  submitBtn: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitTxt: { ...Typography.bodyBold, color: Colors.textInverse },
});
