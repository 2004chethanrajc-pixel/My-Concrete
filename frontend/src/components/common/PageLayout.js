import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';

const PageLayout = ({ children, navigation, activeRoute }) => {
  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <View style={styles.content}>
        {children}
      </View>
      <BottomNavigation navigation={navigation} activeRoute={activeRoute} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
});

export default PageLayout;
