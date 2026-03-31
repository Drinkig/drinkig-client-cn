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
import { colors } from '../../constants/colors';
import { useTranslation } from "react-i18next";

interface CalendarModalProps {
  visible: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

LocaleConfig.locales.ko = {
  monthNames: [
    "01월", "02월", "03월", "04월", "05월", "06월",
    "07월", "08월", "09월", "10월", "11월", "12월",
  ],
  monthNamesShort: [
    "01월", "02월", "03월", "04월", "05월", "06월",
    "07월", "08월", "09월", "10월", "11월", "12월",
  ],
  dayNames: [
    "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일",
  ],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};

LocaleConfig.locales.en = {
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  monthNamesShort: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  dayNames: [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};

export default function CalendarModal({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}: CalendarModalProps) {
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';
  LocaleConfig.defaultLocale = isEn ? 'en' : 'ko';

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
                <Text style={styles.modalTitle}>{t('tastingNoteWrite.calendar.title')}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
              <Calendar
                key={i18n.language}
                current={selectedDate}
                onDayPress={(day) => {
                  onDateSelect(day.dateString);
                  onClose();
                }}
                maxDate={new Date().toISOString().split("T")[0]}
                monthFormat={isEn ? "yyyy MMMM" : "yyyy년 MM월"}
                theme={{
                  backgroundColor: colors.surface1,
                  calendarBackground: colors.surface1,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.white,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.white,
                  textDisabledColor: "#444",
                  monthTextColor: colors.white,
                  arrowColor: colors.primary,
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: colors.primary,
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
    backgroundColor: colors.surface1,
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
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 4,
  },
});
