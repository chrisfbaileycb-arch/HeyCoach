import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { getPersonaById } from '@/constants/personas';
import { VoicePulse } from '@/components';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'coach';
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_CMDS = [
  "What's on my agenda?",
  'Status update',
  'Goal review',
  'What should I focus on?',
  'Snooze next session',
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { activePersonaId, intensity, sendVoiceCommand } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [ttsReady, setTtsReady] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const persona = getPersonaById(activePersonaId);

  // Auto-scroll when messages update
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, streaming]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;
      setInput('');
      setStreaming('');
      setTtsReady('');

      // Add user message
      const userMsg: Message = { id: `u${Date.now()}`, role: 'user', text: trimmed };
      setMessages(prev => [...prev, userMsg]);
      setIsThinking(true);

      // Private alpha: coaching is computed on-device. Nothing is uploaded.
      const fullText = sendVoiceCommand(trimmed);
      setIsThinking(false);
      setStreaming(fullText);

      // Commit streaming text to message history
      if (fullText) {
        const coachMsg: Message = { id: `c${Date.now()}`, role: 'coach', text: fullText };
        setMessages(prev => [...prev, coachMsg]);
        setStreaming('');
        setTtsReady(fullText);

      } else {
        setIsThinking(false);
      }
    },
    [isThinking, sendVoiceCommand]
  );

  // ─── TTS ───────────────────────────────────────────────────────────────────
  const handleSpeak = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.92, pitch: 0.95 });
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    setStreaming('');
    setTtsReady('');
    Speech.stop();
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Console</Text>
        <View style={styles.headerActions}>
          {ttsReady ? (
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.65 }]}
              onPress={() => handleSpeak(ttsReady)}
            >
              <MaterialIcons name="volume-up" size={18} color={persona.color} />
            </Pressable>
          ) : null}
          {messages.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.65 }]}
              onPress={handleClear}
            >
              <MaterialIcons name="delete-sweep" size={18} color={Colors.textSubtle} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <VoicePulse
          personaColor={persona.color}
          initial={persona.name.charAt(0)}
          isActive={isThinking || !!streaming}
          size={68}
        />
        <Text style={[styles.personaName, { color: persona.color }]}>{persona.name}</Text>
        <Text style={styles.personaSub}>{persona.subtitle}</Text>
        <View style={[styles.intensityBadge, { backgroundColor: persona.color + '18', borderColor: persona.color + '35' }]}>
          <Text style={[styles.intensityTxt, { color: persona.color }]}>
            {INTENSITY_LABELS[intensity] ?? 'Firm'} · {intensity}/5
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isThinking && !streaming ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="chat-bubble-outline" size={32} color={Colors.border} />
            <Text style={styles.emptyTitle}>Ask your coach anything</Text>
            <Text style={styles.emptyTxt}>
              Your agenda, goals, and intensity are loaded.{'\n'}
              Tap a quick command or type below.
            </Text>
          </View>
        ) : null}

        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? styles.userBubble
                : [styles.coachBubble, { borderLeftColor: persona.color }],
            ]}
          >
            {msg.role === 'coach' && (
              <View style={styles.bubbleHeader}>
                <Text style={[styles.bubbleLabel, { color: persona.color }]}>
                  {persona.name}
                </Text>
                <Pressable
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => handleSpeak(msg.text)}
                >
                  <MaterialIcons name="volume-up" size={12} color={persona.color + '88'} />
                </Pressable>
              </View>
            )}
            <Text style={[styles.bubbleTxt, msg.role === 'user' && styles.userTxt]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {/* Streaming bubble */}
        {streaming ? (
          <View style={[styles.bubble, styles.coachBubble, { borderLeftColor: persona.color }]}>
            <Text style={[styles.bubbleLabel, { color: persona.color }]}>{persona.name}</Text>
            <Text style={styles.bubbleTxt}>{streaming}</Text>
            <View style={styles.streamingDot} />
          </View>
        ) : null}

        {/* Thinking indicator */}
        {isThinking && !streaming ? (
          <View style={[styles.bubble, styles.coachBubble, { borderLeftColor: persona.color }]}>
            <Text style={[styles.bubbleLabel, { color: persona.color }]}>{persona.name}</Text>
            <Text style={styles.thinkingDots}>• • •</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Quick Commands */}
      <View style={styles.quickWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_CMDS.map(cmd => (
            <Pressable
              key={cmd}
              style={({ pressed }) => [
                styles.chip,
                pressed && { opacity: 0.7, borderColor: persona.color },
              ]}
              onPress={() => handleSend(cmd)}
              disabled={isThinking || !!streaming}
            >
              <Text style={styles.chipTxt}>{cmd}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <TextInput
            style={styles.textInput}
            placeholder={isThinking || streaming ? 'Coach is responding...' : 'Ask your coach...'}
            placeholderTextColor={Colors.textSubtle}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={() => handleSend(input)}
            editable={!isThinking && !streaming}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: persona.color,
                opacity: pressed ? 0.8 : input.trim() && !isThinking && !streaming ? 1 : 0.35,
              },
            ]}
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isThinking || !!streaming}
          >
            <MaterialIcons name="send" size={19} color={Colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  avatarWrap: { alignItems: 'center', paddingVertical: Spacing.sm, paddingBottom: Spacing.md },
  personaName: { ...Typography.bodyBold, marginTop: Spacing.sm },
  personaSub: { ...Typography.small, color: Colors.textSubtle, marginTop: 2 },
  intensityBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  intensityTxt: { ...Typography.micro },

  messages: { flex: 1 },
  messagesContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.bodyBold, color: Colors.textSecondary, marginTop: Spacing.sm },
  emptyTxt: {
    ...Typography.small,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
  },

  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxWidth: '88%',
  },
  coachBubble: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bubbleLabel: {
    ...Typography.micro,
    textTransform: 'uppercase',
  },
  bubbleTxt: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  userTxt: { color: Colors.textSecondary },
  thinkingDots: { ...Typography.h2, color: Colors.textSubtle, letterSpacing: 6 },

  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    alignSelf: 'flex-start',
  },

  quickWrap: {
    maxHeight: 56,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipTxt: { ...Typography.small, color: Colors.textSecondary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.text,
    ...Typography.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
