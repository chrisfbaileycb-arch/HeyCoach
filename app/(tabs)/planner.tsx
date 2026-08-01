import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import type { Session, Goal } from '@/types';

// ─── Grid constants ──────────────────────────────────────────────────────────
const HOUR_HEIGHT = 72;
const START_HOUR = 6;   // 6 AM
const END_HOUR = 23;    // 11 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const TIME_COL = 56;
const MIN_BLOCK_H = 40;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number) => n.toString().padStart(2, '0');

function hourLabel(h: number) {
  if (h === 12) return '12 PM';
  if (h === 0 || h === 24) return '12 AM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function timeToY(hour: number, minute: number) {
  return (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
}

function formatBlockTime(isoStr: string) {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h < 12 ? 'AM' : 'PM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:${pad(m)} ${period}`;
}

function isoDateStr(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatHeaderDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function catColor(category: string) {
  switch (category) {
    case 'morning': return Colors.morning;
    case 'midday':  return Colors.midday;
    case 'evening': return Colors.evening;
    default:        return Colors.primary;
  }
}

function autoCategory(hour: number): Session['category'] {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'midday';
  return 'evening';
}

// ─── Duration chips ───────────────────────────────────────────────────────────
const DURATIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h',  value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h',  value: 120 },
];

// ─── Add Session Modal ────────────────────────────────────────────────────────
interface AddForm {
  title: string;
  hour: string;
  minute: string;
  ampm: 'AM' | 'PM';
  duration: number;
  category: Session['category'];
  linkedGoalId: string;
}

interface AddModalProps {
  visible: boolean;
  date: Date;
  initialHour?: number;
  goals: Goal[];
  onClose: () => void;
  onAdd: (s: Omit<Session, 'id' | 'snoozeCount' | 'status'>) => void;
}

function AddSessionModal({ visible, date, initialHour, goals, onClose, onAdd }: AddModalProps) {
  const buildDefault = useCallback((): AddForm => {
    const h = initialHour ?? new Date().getHours();
    const d12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return {
      title: '',
      hour: d12.toString(),
      minute: '00',
      ampm: h < 12 ? 'AM' : 'PM',
      duration: 0,
      category: autoCategory(h),
      linkedGoalId: '',
    };
  }, [initialHour]);

  const [form, setForm] = useState<AddForm>(buildDefault);

  useEffect(() => {
    if (visible) setForm(buildDefault());
  }, [visible, buildDefault]);

  const unlinked = goals.filter(g => g.status !== 'completed' && g.linkedSessionIds.length === 0);

  const set = <K extends keyof AddForm>(key: K, val: AddForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    let h = Math.max(1, Math.min(12, parseInt(form.hour, 10) || 12));
    const m = [0, 15, 30, 45].includes(parseInt(form.minute, 10))
      ? parseInt(form.minute, 10)
      : Math.min(59, Math.max(0, parseInt(form.minute, 10) || 0));
    if (form.ampm === 'PM' && h !== 12) h += 12;
    if (form.ampm === 'AM' && h === 12) h = 0;

    const d = new Date(date);
    d.setHours(h, m, 0, 0);

    onAdd({
      title: form.title.trim(),
      scheduledAt: d.toISOString(),
      category: form.category,
      type: 'session',
      coachMessage: '',
      durationMinutes: form.duration > 0 ? form.duration : undefined,
      linkedGoalId: form.linkedGoalId || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modal.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={modal.card}>
          {/* Header */}
          <View style={modal.header}>
            <Text style={modal.title}>Add Session</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={20} color={Colors.textSubtle} />
            </Pressable>
          </View>

          {/* Date */}
          <View style={modal.dateRow}>
            <MaterialIcons name="event" size={13} color={Colors.textSubtle} />
            <Text style={modal.dateTxt}>{formatHeaderDate(date)}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={modal.label}>SESSION TITLE</Text>
            <TextInput
              style={modal.input}
              placeholder="What are you working on?"
              placeholderTextColor={Colors.textSubtle}
              value={form.title}
              onChangeText={t => set('title', t)}
              autoFocus
            />

            {/* Time row */}
            <Text style={modal.label}>TIME</Text>
            <View style={modal.timeRow}>
              <TextInput
                style={modal.timeInput}
                value={form.hour}
                onChangeText={v => set('hour', v)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={modal.timeSep}>:</Text>
              <TextInput
                style={modal.timeInput}
                value={form.minute}
                onChangeText={v => set('minute', v)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <View style={modal.ampmWrap}>
                {(['AM', 'PM'] as const).map(p => (
                  <Pressable
                    key={p}
                    style={[modal.ampmBtn, form.ampm === p && modal.ampmBtnActive]}
                    onPress={() => set('ampm', p)}
                  >
                    <Text style={[modal.ampmTxt, form.ampm === p && modal.ampmTxtActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration */}
            <Text style={modal.label}>DURATION (OPTIONAL)</Text>
            <View style={modal.chipRow}>
              {DURATIONS.map(d => (
                <Pressable
                  key={d.value}
                  style={[modal.chip, form.duration === d.value && modal.chipActive]}
                  onPress={() => set('duration', form.duration === d.value ? 0 : d.value)}
                >
                  <Text style={[modal.chipTxt, form.duration === d.value && modal.chipTxtActive]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Category */}
            <Text style={modal.label}>BLOCK TYPE</Text>
            <View style={modal.chipRow}>
              {(['morning', 'midday', 'evening'] as Session['category'][]).map(cat => {
                const c = catColor(cat);
                const active = form.category === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[modal.chip, active && { backgroundColor: c + '22', borderColor: c }]}
                    onPress={() => set('category', cat)}
                  >
                    <Text style={[modal.chipTxt, active && { color: c }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Link to goal */}
            {unlinked.length > 0 && (
              <>
                <Text style={modal.label}>LINK TO GOAL (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                    {unlinked.map(g => (
                      <Pressable
                        key={g.id}
                        style={[modal.goalChip, form.linkedGoalId === g.id && modal.goalChipActive]}
                        onPress={() => set('linkedGoalId', form.linkedGoalId === g.id ? '' : g.id)}
                      >
                        <Text
                          style={[modal.goalChipTxt, form.linkedGoalId === g.id && modal.goalChipTxtActive]}
                          numberOfLines={1}
                        >
                          {g.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                modal.addBtn,
                !form.title.trim() && modal.addBtnDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleAdd}
              disabled={!form.title.trim()}
            >
              <MaterialIcons name="add" size={18} color={Colors.textInverse} />
              <Text style={modal.addBtnTxt}>Add to Planner</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Session Detail Sheet ─────────────────────────────────────────────────────
interface DetailSheetProps {
  session: Session | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
}

function DetailSheet({ session, onClose, onComplete, onSnooze }: DetailSheetProps) {
  if (!session) return null;
  const color = catColor(session.category);
  const done = session.status === 'completed';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={detail.overlay} onPress={onClose}>
        <Pressable style={detail.card} onPress={() => {}}>
          <View style={[detail.colorBar, { backgroundColor: color }]} />
          <View style={detail.body}>
            <Text style={[detail.time, { color }]}>
              {formatBlockTime(session.scheduledAt)}
              {session.durationMinutes ? `  ·  ${session.durationMinutes}m` : ''}
            </Text>
            <Text style={detail.title}>{session.title}</Text>
            {session.coachMessage ? (
              <Text style={detail.msg}>{session.coachMessage}</Text>
            ) : null}
            {!done ? (
              <View style={detail.actions}>
                <Pressable
                  style={[detail.btn, { backgroundColor: Colors.success + '18', borderColor: Colors.success + '40' }]}
                  onPress={() => { onComplete(session.id); onClose(); }}
                >
                  <MaterialIcons name="check-circle-outline" size={15} color={Colors.success} />
                  <Text style={[detail.btnTxt, { color: Colors.success }]}>Complete</Text>
                </Pressable>
                <Pressable
                  style={[detail.btn, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '40' }]}
                  onPress={() => { onSnooze(session.id); onClose(); }}
                >
                  <MaterialIcons name="snooze" size={15} color={Colors.primary} />
                  <Text style={[detail.btnTxt, { color: Colors.primary }]}>Snooze 5m</Text>
                </Pressable>
              </View>
            ) : (
              <View style={detail.doneRow}>
                <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={detail.doneTxt}>Completed</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, goals, completeSession, snoozeSession, addSession } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [tapHour, setTapHour] = useState<number | undefined>();
  const [detailSession, setDetailSession] = useState<Session | null>(null);

  // Tick every minute for the now-line
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStr = isoDateStr(new Date());
  const isToday = isoDateStr(selectedDate) === todayStr;

  // Sessions for the selected day
  const daySessions = useMemo(() => {
    const ds = isoDateStr(selectedDate);
    return sessions.filter(s => isoDateStr(new Date(s.scheduledAt)) === ds);
  }, [sessions, selectedDate]);

  // Now-line Y offset
  const nowY = useMemo(() => {
    if (!isToday) return null;
    const h = now.getHours();
    if (h < START_HOUR || h >= END_HOUR) return null;
    return timeToY(h, now.getMinutes());
  }, [now, isToday]);

  // Scroll to current time when switching to today
  useEffect(() => {
    if (isToday) {
      const y = timeToY(now.getHours(), now.getMinutes());
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true }), 200);
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isoDateStr(selectedDate)]);

  const goTo = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const gridH = HOURS.length * HOUR_HEIGHT;
  const completedCount = daySessions.filter(s => s.status === 'completed').length;
  const progress = daySessions.length > 0 ? completedCount / daySessions.length : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Date navigation ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.navBtn}
          onPress={() => goTo(-1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="chevron-left" size={26} color={Colors.text} />
        </Pressable>

        <Pressable style={styles.headerCenter} onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.headerDate}>{formatHeaderDate(selectedDate)}</Text>
          <Text style={[styles.headerSub, isToday && { color: Colors.primary }]}>
            {isToday ? 'Today — tap to refresh' : 'Tap to go to today'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.navBtn}
          onPress={() => goTo(1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="chevron-right" size={26} color={Colors.text} />
        </Pressable>
      </View>

      {/* ── Day summary strip ────────────────────────────────────────── */}
      <View style={styles.strip}>
        {daySessions.length === 0 ? (
          <Text style={styles.stripEmpty}>No sessions — tap + to plan your day</Text>
        ) : (
          <View style={styles.stripFull}>
            <Text style={styles.stripTxt}>
              {completedCount}/{daySessions.length} complete
            </Text>
            <View style={styles.progressOuter}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
            </View>
            <Text style={[styles.stripPct, { color: progress === 1 ? Colors.success : Colors.textSubtle }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* ── Time grid ───────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={{ height: gridH, position: 'relative' }}>

          {/* Hour rows */}
          {HOURS.map((h, i) => (
            <Pressable
              key={h}
              style={[styles.hourRow, { top: i * HOUR_HEIGHT }]}
              onPress={() => { setTapHour(h); setShowAdd(true); }}
            >
              <Text style={styles.hourLbl}>{hourLabel(h)}</Text>
              <View style={styles.hourLine} />
            </Pressable>
          ))}

          {/* Half-hour tick marks */}
          {HOURS.map((h, i) => (
            <View
              key={`half-${h}`}
              pointerEvents="none"
              style={[styles.halfLine, { top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }]}
            />
          ))}

          {/* Session blocks */}
          {daySessions.map(s => {
            const d = new Date(s.scheduledAt);
            const h = d.getHours();
            const m = d.getMinutes();
            if (h < START_HOUR || h >= END_HOUR) return null;
            const top = timeToY(h, m);
            const blockH = s.durationMinutes
              ? Math.max(MIN_BLOCK_H, (s.durationMinutes / 60) * HOUR_HEIGHT)
              : MIN_BLOCK_H + 4;
            const color = catColor(s.category);
            const done = s.status === 'completed';

            return (
              <Pressable
                key={s.id}
                style={[
                  styles.block,
                  {
                    top,
                    height: blockH,
                    left: TIME_COL + 6,
                    right: 10,
                    backgroundColor: done ? Colors.surface : color + '1A',
                    borderLeftColor: done ? Colors.textSubtle : color,
                    opacity: done ? 0.65 : 1,
                  },
                ]}
                onPress={() => setDetailSession(s)}
              >
                <Text style={[styles.blockTime, { color: done ? Colors.textSubtle : color }]}>
                  {formatBlockTime(s.scheduledAt)}
                  {s.durationMinutes ? `  ${s.durationMinutes}m` : ''}
                </Text>
                <Text
                  style={[styles.blockTitle, done && styles.blockTitleDone]}
                  numberOfLines={blockH > 50 ? 2 : 1}
                >
                  {s.title}
                </Text>
                {done && (
                  <MaterialIcons
                    name="check-circle"
                    size={11}
                    color={Colors.success}
                    style={{ marginTop: 2 }}
                  />
                )}
              </Pressable>
            );
          })}

          {/* Now line */}
          {nowY !== null && (
            <View style={[styles.nowLine, { top: nowY }]} pointerEvents="none">
              <View style={styles.nowDot} />
              <View style={styles.nowBar} />
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + 72,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.93 : 1 }],
          },
        ]}
        onPress={() => { setTapHour(undefined); setShowAdd(true); }}
      >
        <MaterialIcons name="add" size={26} color={Colors.textInverse} />
      </Pressable>

      {/* Modals */}
      <AddSessionModal
        visible={showAdd}
        date={selectedDate}
        initialHour={tapHour}
        goals={goals}
        onClose={() => setShowAdd(false)}
        onAdd={addSession}
      />

      <DetailSheet
        session={detailSession}
        onClose={() => setDetailSession(null)}
        onComplete={completeSession}
        onSnooze={snoozeSession}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate: { ...Typography.h2, color: Colors.text },
  headerSub: { ...Typography.micro, color: Colors.textSubtle, marginTop: 2 },

  strip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  stripEmpty: { ...Typography.small, color: Colors.textSubtle, textAlign: 'center' },
  stripFull: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stripTxt: { ...Typography.smallBold, color: Colors.text, minWidth: 70 },
  progressOuter: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: Radius.full },
  stripPct: { ...Typography.micro, minWidth: 32, textAlign: 'right' },

  scroll: { flex: 1 },

  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLbl: {
    width: TIME_COL,
    paddingTop: 6,
    paddingHorizontal: 8,
    ...Typography.micro,
    color: Colors.textSubtle,
    textAlign: 'right',
  },
  hourLine: {
    flex: 1,
    height: 1,
    marginTop: 12,
    backgroundColor: Colors.border,
  },

  halfLine: {
    position: 'absolute',
    left: TIME_COL,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.4,
  },

  block: {
    position: 'absolute',
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  blockTime: { ...Typography.micro, marginBottom: 2 },
  blockTitle: { ...Typography.smallBold, color: Colors.text },
  blockTitleDone: { textDecorationLine: 'line-through', color: Colors.textSubtle },

  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    marginLeft: TIME_COL - 5,
    marginRight: -2,
    zIndex: 10,
  },
  nowBar: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.danger,
    opacity: 0.8,
  },

  fab: {
    position: 'absolute',
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.text },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.md,
  },
  dateTxt: { ...Typography.small, color: Colors.textSubtle },
  label: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    marginBottom: 2,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    ...Typography.h2,
    width: 58,
    textAlign: 'center',
  },
  timeSep: { ...Typography.h2, color: Colors.textSubtle },
  ampmWrap: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  ampmBtnActive: { backgroundColor: Colors.primary },
  ampmTxt: { ...Typography.smallBold, color: Colors.textSubtle },
  ampmTxtActive: { color: Colors.textInverse },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  chipTxt: { ...Typography.smallBold, color: Colors.textSubtle },
  chipTxtActive: { color: Colors.primary },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 180,
  },
  goalChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  goalChipTxt: { ...Typography.small, color: Colors.textSubtle },
  goalChipTxtActive: { color: Colors.primary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    minHeight: 52,
  },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnTxt: { ...Typography.bodyBold, color: Colors.textInverse },
});

// ─── Detail styles ────────────────────────────────────────────────────────────
const detail = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorBar: { height: 4, width: '100%' },
  body: { padding: Spacing.md },
  time: { ...Typography.micro, textTransform: 'uppercase', marginBottom: 6 },
  title: { ...Typography.h2, color: Colors.text, marginBottom: 8 },
  msg: {
    ...Typography.small,
    color: Colors.textSubtle,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnTxt: { ...Typography.smallBold },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  doneTxt: { ...Typography.small, color: Colors.success },
});
