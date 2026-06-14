import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { getWishlist, WishlistItemDTO } from "../api/wine";
import { WineDBItem } from "../types/Wine";
import GlassHeader from "../components/common/GlassHeader";
import { colors } from "../constants/colors";
import { getWineTypeColor } from "../constants/wineColors";

export default function WishlistScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItemDTO[]>([]);

  useEffect(() => {
    if (isFocused) {
      fetchWishlist();
    }
  }, [isFocused]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const response = await getWishlist();
      if (response.isSuccess) {
        setWishlist(response.result || []);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWinePress = (item: WishlistItemDTO) => {
    const wineItem: WineDBItem = {
      id: item.wineId,
      nameKor: item.name,
      nameEng: item.nameEng,
      type: item.sort,
      country: item.country,
      grape: item.variety,
      imageUri: item.imageUrl,
      vivinoRating: item.vivinoRating,
      price: item.price,
    };
    // @ts-ignore
    navigation.navigate("WineDetail", { wine: wineItem });
  };

  const renderItem = ({ item }: { item: WishlistItemDTO }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleWinePress(item)}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Icon name="wine" size={30} color="#8e44ad" />
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nameKor} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.nameEng} numberOfLines={1}>
          {item.nameEng}
        </Text>
        <View style={styles.detailRow}>
          <View
            style={[
              styles.typeChip,
              { backgroundColor: getWineTypeColor(item.sort) },
            ]}
          >
            <Text style={styles.typeChipText}>{item.sort}</Text>
          </View>
          <Text style={styles.countryText}>{item.country}</Text>
        </View>
      </View>
      {item.vivinoRating > 0 && (
        <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color={colors.error} />
          <Text style={styles.ratingText}>{item.vivinoRating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* 헤더 */}
      <GlassHeader
        floating={false}
        title="위시리스트"
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* 컨텐츠 */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        ) : (
          <FlatList
            data={wishlist}
            renderItem={renderItem}
            keyExtractor={(item) => item.wineId.toString()}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              wishlist.length > 0 ? (
                <View style={styles.listHeader}>
                  <Text style={styles.countText}>
                    총{" "}
                    <Text style={styles.countHighlight}>{wishlist.length}</Text>
                    개의 와인
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../assets/wish_list.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>위시리스트가 비어있습니다.</Text>
                <Text style={styles.emptySubText}>
                  마음에 드는 와인을 찜해보세요!
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    paddingBottom: 16,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  countHighlight: {
    color: colors.white,
    fontWeight: "bold",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surface1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  image: {
    width: "85%",
    height: "85%",
  },
  infoContainer: {
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  nameKor: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  nameEng: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  countryText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
  },
  ratingText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    marginTop: 60,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
