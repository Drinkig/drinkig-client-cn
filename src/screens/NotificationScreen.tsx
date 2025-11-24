import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useNotification, NotificationItem } from '../context/NotificationContext';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { notifications, markAllAsRead, markAsRead } = useNotification();

  const handleNotificationPress = (id: string) => {
    markAsRead(id);
    // 상세 페이지 이동 로직 등이 있다면 여기에 추가
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    let iconName = 'information-circle';
    let iconColor = '#3498db';

    if (item.type === 'success') {
      iconName = 'checkmark-circle';
      iconColor = '#2ecc71';
    } else if (item.type === 'alert') {
      iconName = 'alert-circle';
      iconColor = '#e74c3c';
    }

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.itemMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity 
          style={styles.readAllButton} 
          onPress={markAllAsRead}
        >
          <Text style={styles.readAllText}>모두 읽음</Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off-outline" size={48} color="#555" />
          <Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  readAllButton: {
    padding: 4,
  },
  readAllText: {
    color: '#888',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    color: '#666',
    fontSize: 12,
  },
  itemMessage: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
});

export default NotificationScreen;

