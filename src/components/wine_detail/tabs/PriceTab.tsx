import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PriceStats from '../PriceStats';
import { getPriceHistory, PriceHistoryDTO } from '../../../api/wine';

interface PriceTabProps {
  wineId: number;
  selectedVintageYear?: string;
}

export default function PriceTab({ wineId, selectedVintageYear }: PriceTabProps) {
  const [history, setHistory] = useState<PriceHistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // API 호출
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // selectedVintageYear가 'ALL'이나 'NV'면 전체 조회, 숫자면 해당 빈티지 조회
        const vintageYear = selectedVintageYear && !isNaN(Number(selectedVintageYear)) 
          ? Number(selectedVintageYear) 
          : undefined;

        const response = await getPriceHistory(wineId, vintageYear);
        if (response.isSuccess) {
          setHistory(response.result);
        }
      } catch (error) {
        console.error('Failed to fetch price history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [wineId, selectedVintageYear]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8e44ad" />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>등록된 가격 정보가 없습니다.</Text>
      </View>
    );
  }

  // PriceStats용 데이터 변환 (기존 컴포넌트 재사용을 위해)
  const statsData = history.map(h => ({
    price: h.price,
    date: h.purchaseDate,
    shop: h.shopName
  }));

  const renderPriceItem = (item: PriceHistoryDTO, index: number) => (
    <View key={index} style={styles.priceItem}>
      <View style={styles.colVintage}>
        <Text style={styles.itemText}>{item.vintage || 'NV'}</Text>
      </View>
      <View style={styles.colDate}>
        <Text style={styles.itemText}>{item.purchaseDate}</Text>
      </View>
      <View style={styles.colShop}>
        <Text style={styles.itemText} numberOfLines={1}>
          {item.shopName || '-'}
        </Text>
      </View>
      <View style={styles.colPrice}>
        <Text style={styles.priceText}>₩{item.price.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <View style={styles.vintageInfoContainer}>
            <Text style={styles.subSectionTitle}>
              구매가 통계 ({selectedVintageYear || '전체'})
            </Text>
            <PriceStats prices={statsData} />
            
            <View style={styles.priceInfoNote}>
               <Ionicons name="information-circle-outline" size={14} color="#888" style={{marginRight: 4}} />
               <Text style={styles.priceInfoText}>
                 삭제된 기록을 포함하여 유저들이 등록한 정보를 집계했습니다.
               </Text>
            </View>
        </View>

        <View style={styles.listContainer}>
            <Text style={styles.subSectionTitle}>구매 내역 리스트</Text>
            
            {/* 리스트 헤더 */}
            <View style={styles.listHeader}>
                <View style={styles.colVintage}><Text style={styles.headerText}>빈티지</Text></View>
                <View style={styles.colDate}><Text style={styles.headerText}>구매일</Text></View>
                <View style={styles.colShop}><Text style={styles.headerText}>구매처</Text></View>
                <View style={styles.colPrice}><Text style={styles.headerText}>가격</Text></View>
            </View>

            {/* 리스트 아이템 */}
            {history.map((item, index) => (
                <View key={index}>
                    {renderPriceItem(item, index)}
                    {index < history.length - 1 && <View style={styles.separator} />}
                </View>
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingTop: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  vintageInfoContainer: {
    marginTop: 8,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 12,
    marginTop: 8,
  },
  priceInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  priceInfoText: {
    color: '#888',
    fontSize: 12,
  },
  listContainer: {
    marginTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    marginBottom: 8,
  },
  headerText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  priceItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
  },
  itemText: {
    color: '#ccc',
    fontSize: 14,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
  },
  // 컬럼 너비 조정
  colVintage: {
    flex: 1.2,
  },
  colDate: {
    flex: 2,
  },
  colShop: {
    flex: 2,
  },
  colPrice: {
    flex: 2,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

