import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const AppHeader = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => navigation.openDrawer()}
        >
          <FontAwesome5 name="bars" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 27,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  hamburger: {
    padding: theme.spacing.sm,
  },
});

export default AppHeader;
