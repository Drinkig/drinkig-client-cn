import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";
import { MemberSearchItem, searchMembers } from "../api/member";
import { getErrorMessageKey } from "../utils/apiError";
import { logScreen } from "utils/analytics";
import { colors } from "../constants/colors";
import { radius, spacing, surfaces } from "../constants/theme";
import { RootStackParamList } from "../types";

/**
 * 친구 찾기: 닉네임 부분 일치 검색 → 유저 프로필로 이동해 팔로우.
 * 피드 탭 헤더의 사람 추가 아이콘에서 진입한다.
 */
export default function FriendSearchScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<MemberSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    logScreen("friend_search");
  }, []);

  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed.length > 0) {
      // 디바운스+응답 대기 동안 "결과 없음"이 먼저 보이지 않도록 검색 중 상태를 켠다
      setIsSearching(true);
      setErrorKey(null);
    }
    const timer = setTimeout(async () => {
      if (trimmed.length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      try {
        const res = await searchMembers(trimmed);
        if (res.isSuccess && Array.isArray(res.result)) {
          setResults(res.result);
        } else {
          setErrorKey("common.error.loadFailed");
        }
      } catch (error) {
        console.error("Member search failed:", error);
        setErrorKey(getErrorMessageKey(error));
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword]);

  const renderItem = ({ item }: { item: MemberSearchItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        navigation.navigate("UserProfile", { memberId: item.memberId })
      }
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require("../assets/Standard_profile.png")
        }
        style={styles.avatar}
      />
      <View style={styles.nameColumn}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isProfilePublic === false && (
            <Icon
              name="lock-closed"
              size={12}
              color={colors.textTertiary}
              accessibilityLabel={t("profile.privateAccount")}
            />
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (keyword.trim().length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Icon name="people-outline" size={44} color={colors.textTertiary} />
          <Text style={styles.stateText}>{t("friendSearch.hint")}</Text>
        </View>
      );
    }
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>
          {errorKey ? t(errorKey) : t("friendSearch.empty")}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <GlassHeader
        floating={false}
        title={t("friendSearch.title")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerSide}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Icon name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Icon
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("friendSearch.placeholder")}
            placeholderTextColor={colors.textSecondary}
            value={keyword}
            onChangeText={setKeyword}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {keyword.length > 0 && (
            <TouchableOpacity
              onPress={() => setKeyword("")}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Icon name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.memberId)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSide: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  searchBarWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: surfaces.raised,
  },
  nameColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: 48,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
