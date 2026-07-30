import React, { useState, useRef, useCallback } from 'react';
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

const QUICK_CMDS = [
  "What's on my agenda?",
  'Status update',
  'Snooze',
  'Mark complete',
  'Goal review',
];

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { voiceHistory, sendVoiceCommand, clearVoiceHistory, activePersonaId } =
    useApp();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const persona = getPersonaById(activePersonaId);
  const initial = persona.name.charAt(0);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;
      setInput('');
      setIsThinking(true);
      await new Promise(r => setTimeout(r, 450));
      const response = sendVoiceCommand(trimmed);
      setLastResponse(response);
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    },
    [isThinking, sendVoiceCommand]
  );

  const handleSpeak = useCallback(() => {
    if (!lastResponse) return;
    Speech.stop();
    Speech.speak(lastResponse, { rate: 0.92, pitch: 0.95 });
  }, [lastResponse]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Console</Text>
        <View style={styles.headerActions}>
          {lastResponse ? (
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.65 },
              ]}
              onPress={handleSpeak}
            >
              <MaterialIcons
                name="volume-up"
                size={18}
                color={persona.color}
              />
            </Pressable>
          ) : null}
          {voiceHistory.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.65 },
              ]}
              onPress={clearVoiceHistory}
            >
              <MaterialIcons
                name="delete-sweep"
                size={18}
                color={Colors.textSubtle}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <VoicePulse
          personaColor={persona.color}
          initial={initial}
          isActive={isThinking}
          size={68}
        />
        <Text style={[styles.personaName, { color: persona.color }]}>
          {persona.name}
        </Text>
        <Text style={styles.personaSub}>{persona.subtitle}</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {voiceHistory.length === 0 && !isThinking ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTxt}>
              Ask your coach anything.{'\n'}Try a quick command below.
            </Text>
          </View>
        ) : null}

        {voiceHistory.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? styles.userBubble
                : [
                    styles.coachBubble,
                    { borderLeftColor: persona.color },
                  ],
            ]}
          >
            {msg.role === 'coach' && (
              <Text style={[styles.bubbleLabel, { color: persona.color }]}>
                {persona.name}
              </Text>
            )}
            <Text
              style={[
                styles.bubbleTxt,
                msg.role === 'user' && styles.userTxt,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}

        {isThinking ? (
          <View
            style={[styles.bubble, styles.coachBubble, { borderLeftColor: persona.color }]}
          >
            <Text style={[styles.bubbleLabel, { color: persona.color }]}>
              {persona.name}
            </Text>
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
                pressed && {
                  opacity: 0.7,
                  borderColor: persona.color,
                },
              ]}
              onPress={() => handleSend(cmd)}
            >
              <Text style={styles.chipTxt}>{cmd}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.inputRow,
            { paddingBottom: insets.bottom + Spacing.sm },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Type a command..."
            placeholderTextColor={Colors.textSubtle}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={() => handleSend(input)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: persona.color,
                opacity: pressed ? 0.8 : input.trim() ? 1 : 0.35,
              },
            ]}
            onPress={() => handleSend(input)}
          >
            <MaterialIcons name="send" size={19} color={Colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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

  avatarWrap: { alignItems: 'center', paddingVertical: Spacing.sm },
  personaName: { ...Typography.bodyBold, marginTop: Spacing.sm },
  personaSub: {
    ...Typography.small,
    color: Colors.textSubtle,
    marginTop: 2,
  },

  messages: { flex: 1 },
  messagesContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
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
  bubbleLabel: {
    ...Typography.micro,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bubbleTxt: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  userTxt: { color: Colors.textSecondary },
  thinkingDots: { ...Typography.h2, color: Colors.textSubtle, letterSpacing: 6 },

  quickWrap: { maxHeight: 56, borderTopWidth: 1, borderTopColor: Colors.border },
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
