import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import DeactivatedAccountScreen from '../features/auth/screens/DeactivatedAccountScreen';
import { colors } from '../theme/colors';

const AppNavigator = () => {
  const { isAuthenticated, isDeactivated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show deactivated screen if user is authenticated but deactivated
  if (isAuthenticated && isDeactivated) {
    return <DeactivatedAccountScreen />;
  }

  return isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
