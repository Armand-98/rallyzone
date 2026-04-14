import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors }     from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';

// Crisis contacts — never behind a paywall, never removable
const CRISIS_CONTACTS = [
  {
    id:    'vcl',
    label: 'Veterans Crisis Line',
    sub:   'Press 1 when connected',
    phone: '18002738255',
  },
  {
    id:    '988',
    label: '988 Suicide & Crisis Lifeline',
    sub:   'Available 24/7',
    phone: '988',
  },
];

export function CrisisRail() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleDial = async (phone: string) => {
    setModalVisible(false);
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <>
      {/* Rail — always rendered at the bottom of every screen */}
      <View style={styles.rail}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open crisis support options"
        >
          <View style={styles.dot} />
          <Text style={styles.btnText}>Crisis support</Text>
        </TouchableOpacity>
      </View>

      {/* Modal — shown on tap */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>

            <Text style={styles.sheetTitle}>You're not alone.</Text>
            <Text style={styles.sheetSub}>
              Tap to connect immediately. These lines are free, confidential,
              and available 24/7.
            </Text>

            {CRISIS_CONTACTS.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactBtn}
                onPress={() => handleDial(contact.phone)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.label}`}
              >
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactSub}>{contact.sub}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.dismissText}>I'm okay — go back</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // --- Rail ---
  rail: {
    backgroundColor: Colors.bgPrimary,
    borderTopWidth:  1,
    borderTopColor:  Colors.borderLight,
    paddingBottom:   Platform.OS === 'ios' ? 28 : Spacing.sm,
    paddingTop:      Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  btn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.crisisBtnBg,
    borderWidth:     1,
    borderColor:     Colors.crisisBtn,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.sm,
    gap:             Spacing.xs,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    Radius.full,
    backgroundColor: Colors.crisisBtn,
  },
  btnText: {
    fontFamily:  Typography.fontFamily,
    fontSize:    Typography.size.sm,
    fontWeight:  Typography.medium,
    color:       Colors.crisisBtn,
    letterSpacing: 0.2,
  },

  // --- Modal ---
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding:         Spacing.xl,
    paddingBottom:   Platform.OS === 'ios' ? 48 : Spacing.xl,
  },
  sheetTitle: {
    fontFamily:  Typography.fontFamily,
    fontSize:    Typography.size.lg,
    fontWeight:  Typography.bold,
    color:       Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sheetSub: {
    fontFamily:  Typography.fontFamily,
    fontSize:    Typography.size.sm,
    fontWeight:  Typography.regular,
    color:       Colors.textSecondary,
    lineHeight:  Typography.size.sm * Typography.leading.loose,
    marginBottom: Spacing.lg,
  },
  contactBtn: {
    backgroundColor: Colors.crisisBtnBg,
    borderWidth:     1.5,
    borderColor:     Colors.crisisBtn,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  contactLabel: {
    fontFamily:  Typography.fontFamily,
    fontSize:    Typography.size.base,
    fontWeight:  Typography.bold,
    color:       Colors.crisisBtn,
    marginBottom: 2,
  },
  contactSub: {
    fontFamily: Typography.fontFamily,
    fontSize:   Typography.size.xs,
    fontWeight: Typography.regular,
    color:      Colors.crisisBtnDark,
  },
  dismissBtn: {
    alignItems:  'center',
    paddingTop:  Spacing.md,
  },
  dismissText: {
    fontFamily: Typography.fontFamily,
    fontSize:   Typography.size.sm,
    fontWeight: Typography.regular,
    color:      Colors.textTertiary,
  },
});
