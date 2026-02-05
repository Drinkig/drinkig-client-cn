import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';

interface SelectionModalProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onSelectOption1: () => void;
    option1Text: string;
    onSelectOption2: () => void;
    option2Text: string;
}

const SelectionModal = ({
    visible,
    title,
    message,
    onClose,
    onSelectOption1,
    option1Text,
    onSelectOption2,
    option2Text,
}: SelectionModalProps) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.alertBox}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.optionButton1} onPress={onSelectOption1}>
                                    <Text style={styles.optionText1}>{option1Text}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.optionButton2} onPress={onSelectOption2}>
                                    <Text style={styles.optionText2}>{option2Text}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBox: {
        width: 280,
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    optionButton1: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#8e44ad',
        alignItems: 'center',
    },
    optionText1: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    optionButton2: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#e74c3c',
        alignItems: 'center',
    },
    optionText2: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#333',
        alignItems: 'center',
    },
    cancelText: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SelectionModal;
