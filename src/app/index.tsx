import { useGameMap } from '@/contexts/GameMapContext';
import { useSettings } from '@/contexts/SettingsContext';
import { sampleMap } from '@/data/sampleMap';
import { getQuickActions, processCommand } from '@/engine/gameEngine';
import { checkAnswerSemantically } from '@/services/answerService';
import { getFlavorResponse } from '@/services/flavorService';
import { saveGame } from '@/services/saveService';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function WelcomeScreen() {
  const { startNewGame } = useGameMap();
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        welcomeStyles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={[welcomeStyles.title, { color: colors.accent }]}>Text Adventure</Text>
      <Text style={[welcomeStyles.tagline, { color: colors.textSecondary }]}>
        Hand-built or AI-generated worlds, explored one typed command at a time.
      </Text>

      <Text style={[welcomeStyles.paragraph, { color: colors.text }]}>
        This is a text adventure game. Move around, solve puzzles, and make
        your way through each world by typing simple commands, or by
        tapping the suggested actions that appear as you play, which do
        exactly the same thing.
      </Text>

      <Text style={[welcomeStyles.paragraph, { color: colors.text }]}>
        Try a hand-built adventure below, or head to{' '}
        <Text style={[welcomeStyles.highlight, { color: colors.accent }]}>New Game</Text> in the
        menu to describe your own setting and let AI build a world for you to explore.
      </Text>

      <TouchableOpacity
        style={[welcomeStyles.primaryButton, { backgroundColor: colors.accent }]}
        onPress={() => startNewGame(sampleMap)}
      >
        <Text style={[welcomeStyles.primaryButtonText, { color: colors.accentText }]}>
          Try the Default Adventure
        </Text>
      </TouchableOpacity>

      <Text style={[welcomeStyles.footnote, { color: colors.textMuted }]}>
        New here? Check "How to Play" in the menu for a full list of commands.
      </Text>
    </ScrollView>
  );
}

export default function GameScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { hasStartedGame, saveId, map, state, log, setStateAndLog } = useGameMap();
  const { colors, quickActionsEnabled } = useSettings();
  const [input, setInput] = useState('');

  if (!hasStartedGame || !map || !state) {
    return <WelcomeScreen />;
  }

  const executeCommand = async (command: string) => {
    const commandLine = [...log, '', `> ${command}`];

    if (command.toLowerCase() === 'save') {
      try {
        await saveGame(saveId, map, state, log);
        setStateAndLog(state, [...commandLine, 'Game saved. Find it under Saved Games.']);
      } catch (err) {
        setStateAndLog(state, [...commandLine, 'Something went wrong saving your game.']);
      }
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    const { newState, output, unrecognized, needsAnswerCheck } = processCommand(map, state, command);

    if (!unrecognized) {
      setStateAndLog(newState, [...commandLine, ...output]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      if (needsAnswerCheck) {
        const isActuallyCorrect = await checkAnswerSemantically(
          needsAnswerCheck.officialAnswer,
          needsAnswerCheck.guess
        );

        if (isActuallyCorrect) {
          const { newState: correctedState, output: correctedOutput } = processCommand(
            map,
            state,
            'solve __FORCE_CORRECT__'
          );
          setStateAndLog(correctedState, [...commandLine, ...correctedOutput]);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
      return;
    }

    setStateAndLog(newState, [...commandLine, '...']);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    const flavorText = await getFlavorResponse(command, map, newState);

    if (flavorText) {
      setStateAndLog(newState, [...commandLine, `(nothing happens) ${flavorText}`]);
    } else {
      setStateAndLog(newState, [...commandLine, ...output]);
    }

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSubmit = async () => {
    const command = input.trim();
    if (command === '') return;
    setInput('');
    await executeCommand(command);
  };

  const quickActions = quickActionsEnabled ? getQuickActions(map, state) : [];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollViewRef} style={styles.flex} contentContainerStyle={styles.logContainer}>
        {log.map((line, i) => (
          <Text
            key={i}
            style={[
              styles.logText,
              { color: colors.accent },
              line.startsWith('>') && [styles.commandText, { color: colors.text }],
            ]}
          >
            {line}
          </Text>
        ))}
      </ScrollView>

      {quickActions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipsRow, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}
          contentContainerStyle={styles.chipsContent}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.command}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => executeCommand(action.command)}
            >
              <Text style={[styles.chipText, { color: colors.accent }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Type a command..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent }]} onPress={handleSubmit}>
          <Text style={[styles.sendButtonText, { color: colors.accentText }]}>Go</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const welcomeStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  highlight: {
    fontWeight: 'bold',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 24,
  },
  primaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  footnote: {
    fontSize: 12,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  logContainer: {
    padding: 16,
    paddingTop: 70,
  },
  logText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  commandText: {
    fontWeight: 'bold',
  },
  chipsRow: {
    flexGrow: 0,
    borderTopWidth: 1,
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8,
  },
  sendButtonText: {
    fontWeight: 'bold',
  },
});