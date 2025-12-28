import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useGlobalUI } from '../context/GlobalUIContext';
import CustomAlert from './CustomAlert';

const GlobalComponents = () => {
  const { isLoading, alertConfig, closeAlert } = useGlobalUI();

  return (
    <>

      {isLoading && (
        <Modal transparent={true} animationType="fade" visible={isLoading}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8e44ad" />
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
        confirmText={alertConfig?.confirmText}
        singleButton={alertConfig?.singleButton}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalComponents;

