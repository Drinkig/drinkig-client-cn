import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { HeroSection } from "../components/home/HeroSection";
import { getMyWines, MyWineDTO } from "../api/wine";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../context/SubscriptionContext";
import { RecentReviewsSection } from "../components/home/RecentReviewsSection";

const FLIP_DURATION = 550;

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();

  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);

  // Flip transition state
  const heroRef = useRef<View>(null);
  const [flipping, setFlipping] = useState(false);
  const [cardRect, setCardRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const layoutAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      fetchMyWines();
    }
  }, [isFocused]);

  useEffect(() => {
    refreshSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHeroPress = () => {
    // Free users can enter the chat — Drinky will explain the premium
    // subscription inside the conversation rather than blocking entry here.
    if (flipping) return;
    heroRef.current?.measureInWindow((x, y, w, h) => {
      if (!w || !h) {
        // Fallback if measurement fails
        navigation.navigate("SommelierChat");
        return;
      }
      setCardRect({ x, y, w, h });
      setFlipping(true);
      layoutAnim.setValue(0);
      flipAnim.setValue(0);
      Animated.parallel([
        Animated.timing(layoutAnim, {
          toValue: 1,
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.navigate("SommelierChat");
        // Keep overlay visible briefly so the chat screen can fade in underneath
        setTimeout(() => {
          setFlipping(false);
          setCardRect(null);
          layoutAnim.setValue(0);
          flipAnim.setValue(0);
        }, 400);
      });
    });
  };

  const fetchMyWines = async () => {
    try {
      const response = await getMyWines();
      if (response.isSuccess && response.result) {
        setMyWines(response.result);
      } else {
        setMyWines([]);
      }
    } catch (error) {
      console.error("Failed to fetch my wines summary:", error);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />

        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate("Search" as never)}
            activeOpacity={0.85}
          >
            <Icon name="search" size={19} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>
              {t("home.searchPlaceholder")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Wishlist" as never)}
            activeOpacity={0.85}
          >
            <Icon name="heart-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            ref={heroRef}
            collapsable={false}
            style={{ opacity: flipping ? 0 : 1 }}
          >
            <HeroSection onPress={handleHeroPress} />
          </View>

          <RecentReviewsSection />

          <View style={styles.quickMenuContainer}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("TastingNoteWrite" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="notebook-edit-outline"
                  size={22}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {t("home.quickMenu.tastingNoteTitle")}
                </Text>
                <Text style={styles.cardSub}>
                  {t("home.quickMenu.tastingNoteSub")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("MyWine" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="bottle-wine-outline"
                  size={22}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {t("home.quickMenu.myWineTitle")}
                </Text>
                <View style={styles.statRow}>
                  <Text style={styles.statNumber}>{myWines.length}</Text>
                  <Text style={styles.statUnit}>
                    {t("home.quickMenu.bottlesUnit")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("FoodSelection" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={22}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {t("home.quickMenu.foodPairingTitle")}
                </Text>
                <Text style={styles.cardSub}>
                  {t("home.quickMenu.foodPairingSub")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Camera" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="line-scan"
                  size={22}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {t("home.quickMenu.menuScanTitle")}
                </Text>
                <Text style={styles.cardSub}>
                  {t("home.quickMenu.menuScanSub")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {flipping && cardRect && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={{
              position: "absolute",
              left: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.x, 0],
              }),
              top: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.y, 0],
              }),
              width: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.w, SCREEN_W],
              }),
              height: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.h, SCREEN_H],
              }),
              borderRadius: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [radius.xl, 0],
              }),
              overflow: "hidden",
            }}
          >
            {/* Front face - hero card accent */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backfaceVisibility: "hidden",
                  transform: [
                    { perspective: 1200 },
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: surfaces.card },
                ]}
              />
              <LinearGradient
                colors={[accent.soft, "transparent"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.1, y: 0.9 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Back face - chat screen */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backfaceVisibility: "hidden",
                  transform: [
                    { perspective: 1200 },
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["180deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: colors.background },
                ]}
              />
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: surfaces.raised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  searchPlaceholder: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  quickMenuContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickCard: {
    flexGrow: 1,
    flexBasis: "40%",
    height: 132,
    padding: spacing.lg,
    justifyContent: "space-between",
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: accent.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statNumber: {
    color: accent.text,
    fontSize: 18,
    fontWeight: "700",
    marginRight: spacing.xs,
  },
  statUnit: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
});
