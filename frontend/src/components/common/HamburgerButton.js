import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const HamburgerButton = ({ navigation }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.toggleDrawer()}
    >
      <FontAwesome5 name="bars" size={20} color="#000000" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 6,
  },
});

export default HamburgerButton;
