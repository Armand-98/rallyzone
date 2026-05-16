import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  body: string;
  step: number;
  total: number;
  onDismiss: () => void;
};

export default function CoachMark({ title, body, step, total, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onDismiss} />
        <View style={[s.card, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={s.stepRow}>
            {Array.from({ length: total }, (_, i) => (
              <View
                key={i}
                style={[s.pip, i === step - 1 ? s.pipActive : i < step - 1 ? s.pipDone : null]}
              />
            ))}
          </View>
          <Text style={s.stepLabel}>STEP {step} OF {total}</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.body}>{body}</Text>
          <TouchableOpacity style={s.btn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={s.btnText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000CC' },
  card: {
    backgroundColor: '#1C1C1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2A2A28',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  stepRow:   { flexDirection: 'row', gap: 6, marginBottom: 14 },
  pip:       { height: 4, flex: 1, borderRadius: 2, backgroundColor: '#252523' },
  pipActive: { backgroundColor: '#5B8A5F' },
  pipDone:   { backgroundColor: '#2E4A30' },
  stepLabel: { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10 },
  title:     { fontSize: 22, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.3, marginBottom: 12 },
  body:      { fontSize: 14, color: '#7A7975', lineHeight: 22, marginBottom: 28 },
  btn:       { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  btnText:   { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
});
