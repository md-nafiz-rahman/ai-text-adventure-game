import { useSettings } from '@/contexts/SettingsContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HowToPlayScreen() {
  const { colors } = useSettings();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.accent }]}>How to Play</Text>

        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          This is a text adventure game. You explore, solve puzzles, and make
          your way through each world by typing short commands, or by tapping
          the suggested actions that appear above the text box, which do
          exactly the same thing as typing them yourself.
        </Text>

        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          You don't need to get the exact wording right, "walk north" or "grab
          the flashlight" work just as well as "go north" or "take flashlight".
          And if you type something the game genuinely doesn't recognise, it
          won't just tell you off; it'll react in character, so exploring and
          experimenting is always safe.
        </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Getting Around</Text>
        <Text style={[styles.command, { color: colors.text }]}>look</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>See what's in the room around you.</Text>

        <Text style={[styles.command, { color: colors.text }]}>go [direction]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Move somewhere new, e.g. "go north" or "go up".</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Items</Text>
        <Text style={[styles.command, { color: colors.text }]}>take [item]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Pick something up, e.g. "take sword".</Text>

        <Text style={[styles.command, { color: colors.text }]}>inventory</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>See what you're currently carrying.</Text>

        <Text style={[styles.command, { color: colors.text }]}>examine [item]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Take a closer look at something.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Puzzles</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Some rooms have a riddle or puzzle blocking your way. Solving one
          might unlock a path forward or reveal something hidden.
        </Text>

        <Text style={[styles.command, { color: colors.text }]}>solve [your answer]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Try to answer the puzzle in the room.</Text>

        <Text style={[styles.command, { color: colors.text }]}>hint</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Stuck? Ask for a clue.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Danger</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Some rooms have something guarding your way. You'll need the right
          item to get past them safely.
        </Text>

        <Text style={[styles.command, { color: colors.text }]}>fight [enemy]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Try to overcome whatever's blocking you.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Asking the Narrator</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Curious about the story, your objective, or something you've
          already seen? Ask the narrator directly, in your own words.
        </Text>

        <Text style={[styles.command, { color: colors.text }]}>ask [your question]</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          e.g. "ask what am I supposed to do" or "ask who lived here". The
          narrator only knows about places you've actually explored, so it
          won't spoil anything you haven't found yet, and it won't give away
          puzzle answers or an enemy's weakness, that's still for you to
          discover.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Your Goal</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Every adventure has an objective, maybe there's a treasure to find,
          a place to reach, or something you need to overcome. Keep exploring
          and experimenting to figure out what your story needs from you.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Creating a New Adventure</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Head to "New Game" in the menu to begin a fresh story. Describe a
          setting you would like to explore, a spooky castle, a hidden jungle
          temple, anything you can imagine or just ask for a surprise and
          see what adventure awaits you.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Saving Your Progress</Text>
        <Text style={[styles.command, { color: colors.text }]}>save</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Store your progress. Find it later under "Saved Games" in the
          menu, where you can continue, replay, or delete any saved
          adventure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Appearance</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Head to "Settings" in the menu to switch between a dark or light
          look, or to turn the tappable suggested actions on or off.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  command: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginTop: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
});