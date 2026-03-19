import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useGlobalUI } from '../context/GlobalUIContext';
import CustomAlert from './CustomAlert';
import { colors } from '../constants/colors';

const GlobalComponents = () => {
  const { isLoading, alertConfig, closeAlert } = useGlobalUI();

  return (
    <>

      {isLoading && (
        <Modal transparent={true} animationType="fade" visible={isLoading}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </Modal>
      )}


      <CustomAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        onClose={closeAlert}
        onConfirm={() => {
          if (alertConfig?.onConfirm) alertConfig.onConfirm();
          closeAlert();
        }}
        onCancel={() => {
          if (alertConfig?.onCancel) alertConfig.onCancel();
          closeAlert();
        }}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        singleButton={alertConfig?.singleButton}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 22, 28, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalComponents;

