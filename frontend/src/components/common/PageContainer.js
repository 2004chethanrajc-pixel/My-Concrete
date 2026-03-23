import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../../theme/theme';

const PageContainer = ({ 
  children, 
  scrollable = true,
  padding = true,
  backgroundColor = theme.colors.background,
  style = {},
}) => {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    !padding && styles.noPadding,
    style,
  ];
  
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={containerStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={containerStyle}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  noPadding: {
    padding: 0,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
});

export default PageContainer;
