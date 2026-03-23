import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, FlatList,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useOrderActions } from '../hooks';
import apiClient from '../../../services/apiClient';
import AppHeader from '../../../components/common/AppHeader';
import BottomNavigation from '../../../components/common/BottomNavigation';

const { height: screenHeight } = Dimensions.get('window');

const PRODUCT_TYPES = ['concrete', 'bricks'];
const UNITS = ['units', 'bags', 'cubic meters', 'tonnes', 'loads'];

const CreateOrderScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { createOrder, loading } = useOrderActions();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const flatListRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const [financeUsers, setFinanceUsers] = useState([]);
  const [selectedFinance, setSelectedFinance] = useState(null);
  const [showFinancePicker, setShowFinancePicker] = useState(false);

  const [pmUsers, setPmUsers] = useState([]);
  const [selectedPm, setSelectedPm] = useState(null);
  const [showPmPicker, setShowPmPicker] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showProjectToggle, setShowProjectToggle] = useState(false);

  const [form, setForm] = useState({
    productType: 'concrete', productDescription: '', quantity: '',
    unit: 'units', driverName: '', driverPhone: '', vehicleNumber: '',
    deliveryAddress: '', floor: '', notes: '',
    unitPrice: '', totalAmount: '', advanceAmount: '',
  });

  useEffect(() => {
    if (isAdmin) {
      setCustomersLoading(true);
      apiClient.get('/users?role=customer')
        .then(res => setCustomers(res.data.data?.users || res.data.data || []))
        .catch(() => setCustomers([]))
        .finally(() => setCustomersLoading(false));
      apiClient.get('/users?role=finance')
        .then(res => setFinanceUsers(res.data.data?.users || res.data.data || []))
        .catch(() => setFinanceUsers([]));
      apiClient.get('/users?role=project_manager')
        .then(res => setPmUsers(res.data.data?.users || res.data.data || []))
        .catch(() => setPmUsers([]));
      apiClient.get('/projects')
        .then(res => setProjects(res.data.data?.projects || res.data.data || []))
        .catch(() => setProjects([]));
    }
  }, [isAdmin]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (isAdmin && !selectedCustomer) return Alert.alert('Error', 'Please select a customer');
    if (!form.quantity) return Alert.alert('Error', 'Please enter quantity');
    if (isAdmin && !form.totalAmount) return Alert.alert('Error', 'Please enter total amount');
    if (isAdmin && !form.advanceAmount) return Alert.alert('Error', 'Please enter advance amount');
    try {
      const payload = {
        productType: form.productType,
        productDescription: form.productDescription || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        projectId: showProjectToggle && selectedProject ? selectedProject : undefined,
        deliveryAddress: form.deliveryAddress || undefined,
        floor: form.floor || undefined,
        notes: form.notes || undefined,
      };
      if (isAdmin) {
        payload.customerId = selectedCustomer;
        if (selectedFinance) payload.assignedFinance = selectedFinance;
        if (selectedPm) payload.assignedPm = selectedPm;
        if (form.unitPrice) payload.unitPrice = Number(form.unitPrice);
        payload.totalAmount = Number(form.totalAmount);
        payload.advanceAmount = Number(form.advanceAmount);
      }
      await createOrder(payload);
      Alert.alert('Success',
        isAdmin ? 'Order placed successfully' : 'Order submitted for admin approval',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const selectedCustomerName = customers.find(c => c.id === selectedCustomer)?.name;
  const selectedFinanceName = financeUsers.find(f => f.id === selectedFinance)?.name;
  const selectedPmName = pmUsers.find(p => p.id === selectedPm)?.name;
  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name;

  // IMPORTANT: Dynamic dropdown with NO fixed height - expands to show ALL items
  const renderDropdown = (items, onSelect, onClose, showNoneOption = true, getSubText = null) => {
    const dropdownData = showNoneOption ? [{ id: null, name: 'None', email: null }, ...items] : items;
    
    if (dropdownData.length === 0) {
      return (
        <View style={styles.dropdown}>
          <View style={styles.dropdownItem}>
            <Text style={styles.emptyText}>No items available</Text>
          </View>
        </View>
      );
    }
    
    // CRITICAL: No maxHeight or fixed height - let it grow naturally
    return (
      <View style={styles.dropdown}>
        <FlatList
          data={dropdownData}
          keyExtractor={(item, index) => item?.id?.toString() || `none-${index}`}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          style={styles.dropdownList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, !item.id && { color: '#6B7280' }]}>
                {item.name || 'None'}
              </Text>
              {getSubText && item.email && (
                <Text style={styles.dropdownSub} numberOfLines={1}>
                  {item.email}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Render each form section as an item
  const renderFormSection = ({ item }) => {
    switch (item.type) {
      case 'infoBox':
        return !isAdmin ? (
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={16} color="#2563EB" />
            <Text style={styles.infoText}>
              Your order will be reviewed by admin who will set the amount before you can pay.
            </Text>
          </View>
        ) : null;

      case 'customer':
        return isAdmin ? (
          <View style={styles.field}>
            <Text style={styles.label}>Customer *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowCustomerPicker(v => !v)}>
              <Text style={selectedCustomer ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedCustomerName || 'Select customer...'}
              </Text>
              <FontAwesome5 name={showCustomerPicker ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" />
            </TouchableOpacity>
            {showCustomerPicker && renderDropdown(
              customers,
              (id) => setSelectedCustomer(id),
              () => setShowCustomerPicker(false),
              false,
              (item) => item.email
            )}
          </View>
        ) : null;

      case 'finance':
        return isAdmin ? (
          <View style={styles.field}>
            <Text style={styles.label}>Assign Finance (optional)</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowFinancePicker(v => !v)}>
              <Text style={selectedFinance ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedFinanceName || 'Select finance user...'}
              </Text>
              <FontAwesome5 name={showFinancePicker ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" />
            </TouchableOpacity>
            {showFinancePicker && renderDropdown(
              financeUsers,
              (id) => setSelectedFinance(id),
              () => setShowFinancePicker(false),
              true,
              (item) => item.email
            )}
          </View>
        ) : null;

      case 'projectManager':
        return isAdmin ? (
          <View style={styles.field}>
            <Text style={styles.label}>Assign Project Manager (optional)</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowPmPicker(v => !v)}>
              <Text style={selectedPm ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedPmName || 'Select project manager...'}
              </Text>
              <FontAwesome5 name={showPmPicker ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" />
            </TouchableOpacity>
            {showPmPicker && renderDropdown(
              pmUsers,
              (id) => setSelectedPm(id),
              () => setShowPmPicker(false),
              true,
              (item) => item.email
            )}
          </View>
        ) : null;

      case 'productType':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Product Type *</Text>
            <View style={styles.toggleRow}>
              {PRODUCT_TYPES.map((t, i) => (
                <TouchableOpacity key={t}
                  style={[styles.toggleBtn, form.productType === t && styles.toggleBtnActive, i === PRODUCT_TYPES.length - 1 && { marginRight: 0 }]}
                  onPress={() => set('productType', t)}>
                  <Text style={[styles.toggleText, form.productType === t && styles.toggleTextActive]}>
                    {t === 'concrete' ? '🏗️ Concrete' : '🧱 Bricks'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'description':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={form.productDescription}
              onChangeText={v => set('productDescription', v)}
              placeholder="e.g. M25 grade concrete" placeholderTextColor="#9CA3AF" />
          </View>
        );

      case 'quantityUnit':
        return (
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput style={styles.input} value={form.quantity}
                onChangeText={v => set('quantity', v)} keyboardType="numeric"
                placeholder="0" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitScroll}>
                {UNITS.map(u => (
                  <TouchableOpacity key={u}
                    style={[styles.unitBtn, form.unit === u && styles.unitBtnActive]}
                    onPress={() => set('unit', u)}>
                    <Text style={[styles.unitText, form.unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 'pricing':
        return isAdmin ? (
          <View style={styles.amountSection}>
            <Text style={styles.amountSectionTitle}>Pricing</Text>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Unit Price (₹)</Text>
                <TextInput style={styles.input} value={form.unitPrice}
                  onChangeText={v => set('unitPrice', v)} keyboardType="numeric"
                  placeholder="Optional" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Total Amount (₹) *</Text>
                <TextInput style={styles.input} value={form.totalAmount}
                  onChangeText={v => set('totalAmount', v)} keyboardType="numeric"
                  placeholder="0" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Advance Amount (₹) *</Text>
              <TextInput style={styles.input} value={form.advanceAmount}
                onChangeText={v => set('advanceAmount', v)} keyboardType="numeric"
                placeholder="0" placeholderTextColor="#9CA3AF" />
            </View>
          </View>
        ) : null;

      case 'driverName':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Driver Name</Text>
            <TextInput style={styles.input} value={form.driverName}
              onChangeText={v => set('driverName', v)} placeholder="Driver name"
              placeholderTextColor="#9CA3AF" />
          </View>
        );

      case 'driverDetails':
        return (
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Driver Phone</Text>
              <TextInput style={styles.input} value={form.driverPhone}
                onChangeText={v => set('driverPhone', v)} placeholder="Driver phone"
                placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Vehicle Number</Text>
              <TextInput style={styles.input} value={form.vehicleNumber}
                onChangeText={v => set('vehicleNumber', v)} placeholder="e.g. MH12AB1234"
                placeholderTextColor="#9CA3AF" />
            </View>
          </View>
        );

      case 'project':
        return (
          <View style={styles.field}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.label, { marginBottom: 0, flex: 1 }]}>Link to Project</Text>
              <TouchableOpacity
                onPress={() => { setShowProjectToggle(v => !v); if (showProjectToggle) { setSelectedProject(null); setShowProjectPicker(false); } }}
                style={[styles.toggleBtn, { flex: 0, paddingHorizontal: 16, paddingVertical: 6, marginRight: 0 }, showProjectToggle && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, showProjectToggle && styles.toggleTextActive]}>{showProjectToggle ? 'On' : 'Off'}</Text>
              </TouchableOpacity>
            </View>
            {showProjectToggle ? (
              <View>
                <TouchableOpacity style={styles.picker} onPress={() => setShowProjectPicker(v => !v)}>
                  <Text style={selectedProject ? styles.pickerValue : styles.pickerPlaceholder}>
                    {selectedProjectName || 'Select project (optional)...'}
                  </Text>
                  <FontAwesome5 name={showProjectPicker ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" />
                </TouchableOpacity>
                {showProjectPicker && renderDropdown(
                  projects,
                  (id) => setSelectedProject(id),
                  () => setShowProjectPicker(false),
                  true
                )}
              </View>
            ) : null}
          </View>
        );

      case 'address':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={[styles.input, styles.multiline]} value={form.deliveryAddress}
              onChangeText={v => set('deliveryAddress', v)} placeholder="Enter delivery address"
              placeholderTextColor="#9CA3AF" multiline numberOfLines={2} />
          </View>
        );

      case 'floor':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Floor (optional)</Text>
            <TextInput style={styles.input} value={form.floor}
              onChangeText={v => set('floor', v)} placeholder="e.g. 2nd Floor, Ground Floor"
              placeholderTextColor="#9CA3AF" />
          </View>
        );

      case 'notes':
        return (
          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, styles.multiline]} value={form.notes}
              onChangeText={v => set('notes', v)} placeholder="Any special instructions..."
              placeholderTextColor="#9CA3AF" multiline numberOfLines={2} />
          </View>
        );

      case 'submit':
        return (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{isAdmin ? 'Place Order' : 'Submit for Approval'}</Text>}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  // Define the form sections in order
  const formSections = [
    { type: 'infoBox' },
    { type: 'customer' },
    { type: 'finance' },
    { type: 'projectManager' },
    { type: 'productType' },
    { type: 'description' },
    { type: 'quantityUnit' },
    { type: 'pricing' },
    { type: 'driverName' },
    { type: 'driverDetails' },
    { type: 'project' },
    { type: 'address' },
    { type: 'floor' },
    { type: 'notes' },
    { type: 'submit' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <AppHeader navigation={navigation} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={formSections}
          renderItem={renderFormSection}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        />
      </KeyboardAvoidingView>
      <BottomNavigation navigation={navigation} activeRoute="OrdersList" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 10,
    padding: 12, marginBottom: 16, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#2563EB', marginLeft: 8, lineHeight: 18 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1F2937',
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row' },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', marginRight: 10,
  },
  toggleBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  toggleText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  unitScroll: { flexDirection: 'row', flexWrap: 'wrap' },
  unitBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff',
    marginRight: 6, marginBottom: 6,
  },
  unitBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  unitText: { fontSize: 12, color: '#374151' },
  unitTextActive: { color: '#fff', fontWeight: '600' },
  amountSection: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  amountSectionTitle: { fontSize: 14, fontWeight: '700', color: '#15803D', marginBottom: 12 },
  picker: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerValue: { fontSize: 15, color: '#1F2937' },
  pickerPlaceholder: { fontSize: 15, color: '#9CA3AF' },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    // IMPORTANT: No maxHeight, no height restrictions - expands naturally
  },
  dropdownList: {
    // No height restrictions - grows with content
  },
  dropdownItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  dropdownSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CreateOrderScreen;