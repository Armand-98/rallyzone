import { Tabs } from 'expo-router';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CrisisRail() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[cr.rail, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={cr.btn}
        onPress={() => Linking.openURL('tel:988')}
        activeOpacity={0.8}
      >
        <Text style={cr.label}>CRISIS LINE</Text>
        <Text style={cr.num}>988</Text>
      </TouchableOpacity>
      <View style={cr.divider} />
      <TouchableOpacity
        style={cr.btn}
        onPress={() => Linking.openURL('tel:18003424673')}
        activeOpacity={0.8}
      >
        <Text style={cr.label}>VETERANS LINE</Text>
        <Text style={cr.num}>1-800-342-4673</Text>
      </TouchableOpacity>
    </View>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const initials: Record<string, string> = {
    Brief: 'BR', Log: 'LG', Calm: 'CM', Profile: 'PR',
  };
  return (
    <View style={[ti.wrap, focused && ti.wrapOn]}>
      <Text style={[ti.text, focused && ti.textOn]}>{initials[label] ?? label[0]}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#111110' }}>
      <CrisisRail />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111110',
            borderTopColor: '#1C1C1A',
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#5B8A5F',
          tabBarInactiveTintColor: '#3A3A36',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Brief',
            tabBarIcon: ({ focused }) => <TabIcon label="Brief" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ focused }) => <TabIcon label="Log" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="calm"
          options={{
            title: 'Calm',
            tabBarIcon: ({ focused }) => <TabIcon label="Calm" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const cr = StyleSheet.create({
  rail:    { flexDirection: 'row', backgroundColor: '#0D1A0E', borderBottomWidth: 1, borderBottomColor: '#1A2E1B' },
  btn:     { flex: 1, paddingVertical: 10, alignItems: 'center' },
  label:   { fontSize: 9, color: '#4A7A4E', fontWeight: '600', letterSpacing: 0.6, marginBottom: 2 },
  num:     { fontSize: 13, color: '#7FBF85', fontWeight: '700' },
  divider: { width: 1, backgroundColor: '#1A2E1B', marginVertical: 8 },
});

const ti = StyleSheet.create({
  wrap:    { width: 32, height: 20, borderRadius: 4, backgroundColor: '#1C1C1A', justifyContent: 'center', alignItems: 'center' },
  wrapOn:  { backgroundColor: '#1A2E1B' },
  text:    { fontSize: 9, fontWeight: '700', color: '#3A3A36', letterSpacing: 0.3 },
  textOn:  { color: '#5B8A5F' },
});