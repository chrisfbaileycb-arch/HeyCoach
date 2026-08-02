import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

function Navigation() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check onboarding status whenever user changes
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setNeedsOnboarding(false);
      setOnboardingChecked(true);
      return;
    }
    AsyncStorage.getItem(`onboarding_done_${user.id}`).then((val) => {
      setNeedsOnboarding(!val);
      setOnboardingChecked(true);
    });
  }, [user?.id, loading]);

  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const inTabs = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      if (inTabs || inOnboarding) router.replace('/login');
      return;
    }

    if (needsOnboarding) {
      if (!inOnboarding) router.replace('/onboarding');
    } else {
      if (inLogin || inOnboarding || !segments[0]) router.replace('/(tabs)');
    }
  }, [user, loading, segments, needsOnboarding, onboardingChecked]);

  if (loading || (user && !onboardingChecked)) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
