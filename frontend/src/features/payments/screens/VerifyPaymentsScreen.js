import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme, formatCurrency } from '../../../theme/theme';
import { useVerifyPayment } from '../hooks';
import { paymentsApi } from '../api';
import { projectsApi } from '../../projects/api';
import { 
  AppHeader, 
  BottomNavigation, 
  PageContainer, 
  Card, 
  EmptyState, 
  LoadingState,
  PrimaryButton,
  StatusChip 
} from '../../../components/common';
import { useScrollPosition } from '../../../hooks/useScrollPosition';
import { useTheme } from '../../../context/ThemeContext';

const VerifyPaymentsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { verifyPayment, loading: verifying } = useVerifyPayment();
  const { scrollY, onScroll } = useScrollPosition();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch all projects
      const projectsResponse = await projectsApi.getAllProjects();
      const projects = projectsResponse.data.projects;
      
      // Fetch payments for each project
      const allPendingPayments = [];
      for (const project of projects) {
        try {
          const paymentsResponse = await paymentsApi.getPaymentsByProject(project.id);
          const payments = paymentsResponse.data.payments;
          
          // Filter pending payments that have payment_method (customer has paid)
          const pending = payments
            .filter(p => p.status === 'pending' && p.payment_method !== null)
            .map(p => ({
              ...p,
              project_name: project.name,
              project_location: project.location,
            }));
          
          allPendingPayments.push(...pending);
        } catch (err) {
          console.error(`Error fetching payments for project ${project.id}:`, err);
        }
      }
      
      // Sort by created_at (most recent first)
      allPendingPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setPendingPayments(allPendingPayments);
    } catch (err) {
      console.error('Error fetching pending payments:', err);
      Alert.alert('Error', 'Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingPayments();
    setRefreshing(false);
  };

  const handleVerifyPayment = (payment) => {
    Alert.alert(
      'Verify Payment',
      `Verify payment of ${formatCurrency(payment.amount)} for ${payment.project_name}?\n\nPayment Method: ${payment.payment_method}\nTransaction ID: ${payment.transaction_id || 'N/A'}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await verifyPayment(payment.id);
              Alert.alert('Success', 'Payment verified successfully');
              await fetchPendingPayments();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to verify payment');
            }
          },
        },
      ]
    );
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'advance':
        return 'Advance Payment';
      case 'final':
        return 'Final Payment';
      case 'extra':
        return 'Extra Charge';
      default:
        return 'Payment';
    }
  };

  const renderPaymentCard = (payment) => (
    <Card key={payment.id} style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentCardLeft}>
          <Text style={styles.projectName}>{payment.project_name}</Text>
          <View style={styles.paymentDetails}>
            <FontAwesome5 name="map-marker-alt" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.paymentDetailText}>{payment.project_location}</Text>
          </View>
          <View style={styles.paymentTypeRow}>
            <Text style={styles.paymentTypeLabel}>{getPaymentTypeLabel(payment.type)}</Text>
          </View>
          {payment.description && (
            <View style={styles.paymentDetails}>
              <FontAwesome5 name="info-circle" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.paymentDetailText}>{payment.description}</Text>
            </View>
          )}
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>{formatCurrency(payment.amount)}</Text>
        </View>
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payment Method:</Text>
          <Text style={styles.infoValue}>{payment.payment_method}</Text>
        </View>
        {payment.transaction_id && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID:</Text>
            <Text style={styles.infoValue}>{payment.transaction_id}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {new Date(payment.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <PrimaryButton
        title="Verify Payment"
        onPress={() => handleVerifyPayment(payment)}
        disabled={verifying}
        loading={verifying}
        icon="check-circle"
        color="success"
      />
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader navigation={navigation} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {loading ? (
            <LoadingState message="Loading pending payments..." />
          ) : pendingPayments.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="All Caught Up!"
              message="No pending payments to verify"
              iconColor={theme.colors.success}
            />
          ) : (
            <>
              <View style={styles.countBadge}>
                <FontAwesome5 name="clock" size={16} color={theme.colors.textWhite} style={{ marginRight: theme.spacing.sm }} />
                <Text style={styles.countText}>
                  {pendingPayments.length} Payment{pendingPayments.length !== 1 ? 's' : ''} Pending Verification
                </Text>
              </View>
              {pendingPayments.map(renderPaymentCard)}
            </>
          )}
        </ScrollView>
        
        <BottomNavigation 
          navigation={navigation} 
          activeRoute="VerifyPayments" 
          scrollY={scrollY} 
        />
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
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl, // Add extra padding at bottom to account for BottomNavigation
  },
  countBadge: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  countText: {
    ...theme.typography.body1,
    color: theme.colors.textWhite,
    fontWeight: '600',
  },
  paymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    marginBottom: theme.spacing.md,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  paymentCardLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  projectName: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  paymentTypeRow: {
    marginBottom: theme.spacing.xs,
  },
  paymentTypeLabel: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontWeight: '600',
    backgroundColor: `${theme.colors.info}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  paymentDetailText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  amountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    ...theme.typography.h6,
    color: theme.colors.textWhite,
    fontWeight: '700',
  },
  paymentInfo: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});

export default VerifyPaymentsScreen;