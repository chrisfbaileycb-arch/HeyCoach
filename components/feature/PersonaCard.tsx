import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { CoachPersona } from '@/constants/personas';

interface PersonaCardProps {
  persona: CoachPersona;
  isActive: boolean;
  onSelect: () => void;
}

export function PersonaCard({ persona, isActive, onSelect }: PersonaCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isActive && {
          borderColor: persona.color,
          backgroundColor: persona.bgColor,
        },
        pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onSelect}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: persona.color + '20' }]}
      >
        <MaterialIcons
          name={persona.iconName as any}
          size={22}
          color={persona.color}
        />
      </View>
      <Text
        style={[styles.name, isActive && { color: persona.color }]}
        numberOfLines={1}
      >
        {persona.name}
      </Text>
      <Text style={styles.sub} numberOfLines={2}>
        {persona.subtitle}
      </Text>
      {isActive && (
        <View style={[styles.activeBadge, { backgroundColor: persona.color }]}>
          <Text style={styles.activeTxt}>ACTIVE</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    minHeight: 130,
    width: '100%',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    ...Typography.smallBold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 3,
  },
  sub: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 15,
  },
  activeBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeTxt: { ...Typography.micro, color: Colors.textInverse },
});
