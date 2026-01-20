import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import Icon from "react-native-vector-icons/Ionicons";

interface CalendarModalProps {
  visible: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

LocaleConfig.locales.ko = {
  monthNames: [
    "01월",
    "02월",
    "03월",
    "04월",
    "05월",
    "06월",
    "07월",
    "08월",
    "09월",
    "10월",
    "11월",
    "12월",
  ],
  monthNamesShort: [
    "01월",
    "02월",
    "03월",
    "04월",
    "05월",
    "06월",
    "07월",
    "08월",
    "09월",
    "10월",
    "11월",
    "12월",
  ],
  dayNames: [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};

LocaleConfig.defaultLocale = "ko";

export default function CalendarModal({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}: CalendarModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>시음 날짜 선택</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Calendar
                current={selectedDate}
                onDayPress={(day) => {
                  onDateSelect(day.dateString);
                  onClose();
                }}
                maxDate={new Date().toISOString().split("T")[0]}
                monthFormat={"yyyy년 MM월"}
                theme={{
                  backgroundColor: "#2a2a2a",
                  calendarBackground: "#2a2a2a",
                  textSectionTitleColor: "#888",
                  selectedDayBackgroundColor: "#8e44ad",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#8e44ad",
                  dayTextColor: "#ffffff",
                  textDisabledColor: "#444",
                  monthTextColor: "#ffffff",
                  arrowColor: "#8e44ad",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: "#8e44ad",
                  },
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    height: 440,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 4,
  },
});
