import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
      // If no error, auth state change navigates automatically
    } else {
      const { error: err, needsConfirmation } = await signUp(
        email.trim(),
        password,
        username.trim() || undefined
      );
      if (err) {
        setError(err);
      } else if (needsConfirmation) {
        setSuccess('Check your email to confirm your account, then sign in.');
        setMode('signin');
      }
      // If no confirmation needed, auth state change navigates automatically
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setSuccess('');
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <MaterialIcons name="sports" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>HEY COACH</Text>
            <Text style={styles.tagline}>
              {mode === 'signin'
                ? 'The agenda is root state. Every goal needs a block.'
                : 'Pick a persona. Set the intensity. Show up.'}
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>

            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Username (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textSubtle}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textSubtle}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textSubtle}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={18}
                    color={Colors.textSubtle}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorWrap}>
                <MaterialIcons name="error-outline" size={14} color={Colors.danger} />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Success */}
            {success ? (
              <View style={styles.successWrap}>
                <MaterialIcons name="check-circle-outline" size={14} color={Colors.success} />
                <Text style={styles.successTxt}>{success}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: pressed || loading ? 0.8 : 1 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.submitTxt}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            {/* Toggle */}
            <Pressable style={styles.toggleRow} onPress={toggleMode}>
              <Text style={styles.toggleTxt}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.toggleLink}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Footer promise */}
          <View style={styles.footer}>
            {[
              'Voice-first accountability',
              '4 coach personas',
              'Agenda as root state',
            ].map((point) => (
              <View key={point} style={styles.footerItem}>
                <View style={styles.footerDot} />
                <Text style={styles.footerTxt}>{point}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },

  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1.5,
    borderColor: Colors.primary + '35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.small,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md },

  field: { marginBottom: Spacing.md },
  fieldLabel: {
    ...Typography.micro,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.danger + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorTxt: { ...Typography.small, color: Colors.danger, flex: 1 },

  successWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successTxt: { ...Typography.small, color: Colors.success, flex: 1 },

  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: Spacing.sm,
  },
  submitTxt: { ...Typography.bodyBold, color: Colors.textInverse },

  toggleRow: { alignItems: 'center', marginTop: Spacing.md, padding: 4 },
  toggleTxt: { ...Typography.small, color: Colors.textSubtle },
  toggleLink: { color: Colors.primary, fontWeight: '700' },

  footer: { alignItems: 'center', gap: 8 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  footerTxt: { ...Typography.small, color: Colors.textSubtle },
});
