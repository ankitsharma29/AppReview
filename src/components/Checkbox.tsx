// Checkbox.js
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

/**
 * @param {boolean}  checked    - current checked state
 * @param {Function} onChange   - called with new boolean value
 * @param {string}   label      - label text
 */
const Checkbox = ({ checked = false, onChange, label = '' }) => {

  const handlePress = () => {
    if (onChange) onChange(!checked);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#888',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  boxChecked: {
    backgroundColor: '#4F6EF7',
    borderColor: '#4F6EF7',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  label: {
    fontSize: 15,
    color: '#222',
  },
});

export default Checkbox;
