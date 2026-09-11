import { useGameMap } from '@/contexts/GameMapContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { GameMap } from '@/types/game';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BACKEND_URL } from '@/constants/api';

const DEFAULT_MESSAGES = [
  'Building your world...',
  'Drafting the story...',
  'Mapping out the rooms...',
  'Working out the details...',
  'Shaping the setting...',
  'Tying the story threads together...',
  'Connecting the rooms together...',
  'Adding challenges along the way...',
  'Filling the world with things to find...',
  'Bringing the characters to life...',
];

const POLL_INTERVAL_MS = 1500;
const DISPLAY_TICK_MS = 2500;
const MAX_POLL_TIME_MS = 3 * 60 * 1000;

type LanguageDifficulty = 'simple' | 'standard' | 'rich';

function pollForResult(jobId: string, onStatusUpdate: (status: string) => void): Promise<GameMap> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (Date.now() - startedAt > MAX_POLL_TIME_MS) {
        reject(new Error('This is taking longer than expected. Please try again.'));
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/generate/status/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.error || 'Lost connection to the generation job.'));
          return;
        }

        if (data.status) {
          onStatusUpdate(data.status);
        }

        if (data.done) {
          if (data.map) {
            resolve(data.map);
          } else {
            reject(new Error(data.error || 'Something went wrong generating that map.'));
          }
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        reject(new Error('Could not reach the server. Make sure the backend is running.'));
      }
    };

    poll();
  });
}

export default function NewGameScreen() {
  const { startNewGame } = useGameMap();
  const { colors } = useSettings();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayMessage, setDisplayMessage] = useState(DEFAULT_MESSAGES[0]);
  const [languageDifficulty, setLanguageDifficulty] = useState<LanguageDifficulty>('standard');
  const [includeRiddles, setIncludeRiddles] = useState(true);

  const rotatingIndexRef = useRef(0);
  const pendingRealStatusesRef = useRef<string[]>([]);
  const lastSeenStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      if (pendingRealStatusesRef.current.length > 0) {
        const nextReal = pendingRealStatusesRef.current.shift()!;
        setDisplayMessage(nextReal);
      } else {
        rotatingIndexRef.current = (rotatingIndexRef.current + 1) % DEFAULT_MESSAGES.length;
        setDisplayMessage(DEFAULT_MESSAGES[rotatingIndexRef.current]);
      }
    }, DISPLAY_TICK_MS);

    return () => clearInterval(interval);
  }, [loading]);

  const handleStatusUpdate = (status: string) => {
    if (status !== lastSeenStatusRef.current) {
      lastSeenStatusRef.current = status;
      pendingRealStatusesRef.current.push(status);
    }
  };

  const generate = async (desc: string) => {
    setLoading(true);
    setError('');
    rotatingIndexRef.current = 0;
    pendingRealStatusesRef.current = [];
    lastSeenStatusRef.current = null;
    setDisplayMessage(DEFAULT_MESSAGES[0]);

    try {
      const startResponse = await fetch(`${BACKEND_URL}/generate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, languageDifficulty, includeRiddles }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        setError(startData.error || 'Something went wrong starting generation.');
        setLoading(false);
        return;
      }

      const map = await pollForResult(startData.jobId, handleStatusUpdate);
      startNewGame(map);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const difficultyOptions: { value: LanguageDifficulty; label: string }[] = [
    { value: 'simple', label: 'Simple' },
    { value: 'standard', label: 'Standard' },
    { value: 'rich', label: 'Rich' },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.accent }]}>New Adventure</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Describe a setting, or generate a random one
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
          placeholder="e.g. a haunted spaceship with three rooms"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.optionBlock}>
          <Text style={[styles.optionLabel, { color: colors.text }]}>Language difficulty</Text>
          <View style={styles.segmentedRow}>
            {difficultyOptions.map((option) => {
              const selected = languageDifficulty === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: selected ? colors.accent : colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => setLanguageDifficulty(option.value)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      { color: selected ? colors.accentText : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.optionRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.optionRowText}>
            <Text style={[styles.optionLabel, { color: colors.text }]}>Include puzzles &amp; riddles</Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Turn off for a world with no riddles to solve
            </Text>
          </View>
          <Switch
            value={includeRiddles}
            onValueChange={setIncludeRiddles}
            trackColor={{ false: colors.cardBorder, true: colors.accent }}
            thumbColor="#ffffff"
            disabled={loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={() => generate(description)}
          disabled={loading}
        >
          <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>Generate from description</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={() => generate('')}
          disabled={loading}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Surprise me (random)</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{displayMessage}</Text>
          </View>
        )}

        {error !== '' && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    fontSize: 15,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  optionBlock: {
    width: '100%',
    marginBottom: 14,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  optionRowText: {
    flex: 1,
    marginRight: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: 'bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
});