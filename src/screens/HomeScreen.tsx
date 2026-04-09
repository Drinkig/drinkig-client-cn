import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { HeroSection } from '../components/home/HeroSection';
import { BannerSection } from '../components/home/BannerSection';
import { getMyWines, MyWineDTO } from '../api/wine';
import { colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../context/SubscriptionContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FLIP_DURATION = 550;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();

  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [recentWine, setRecentWine] = useState<MyWineDTO | null>(null);

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
  }, []);

  const handleHeroPress = () => {
    // Free users can enter the chat — Drinky will explain the premium
    // subscription inside the conversation rather than blocking entry here.
    if (flipping) return;
    heroRef.current?.measureInWindow((x, y, w, h) => {
      if (!w || !h) {
        // Fallback if measurement fails
        navigation.navigate('SommelierChat');
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
        navigation.navigate('SommelierChat');
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
        if (response.result.length > 0) {
          setRecentWine(response.result[0]);
        } else {
          setRecentWine(null);
        }
      } else {
        setMyWines([]);
        setRecentWine(null);
      }
    } catch (error) {
      console.error('Failed to fetch my wines summary:', error);
    }
  };

  return (
    <View style={styles.rootContainer}>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View style={styles.headerContainer}>
        <View style={styles.headerPill}>
          <TouchableOpacity
            style={styles.searchBarContainer}
            onPress={() => navigation.navigate('Search' as never)}
            activeOpacity={0.9}
          >
            <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
          </TouchableOpacity>

          <View style={styles.headerSeparator} />

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Wishlist' as never)}
          >
            <Icon name="heart-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
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


        <BannerSection />


        <View style={styles.quickMenuContainer}>

          <TouchableOpacity
            style={[styles.quickMenuItem, styles.tastingNoteButton]}
            onPress={() => navigation.navigate('TastingNoteWrite' as never)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../assets/taste_note.png')}
              style={styles.tastingNoteBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.tastingNoteContent}>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>{t('home.quickMenu.tastingNoteTitle')}</Text>
                  <Text style={styles.menuSubLabel}>{t('home.quickMenu.tastingNoteSub')}</Text>
                </View>
                <View style={styles.arrowIconContainer}>
                  <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.quickMenuItem, styles.tastingNoteButton]}
            onPress={() => navigation.navigate('MyWine' as never)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../assets/wine_cellar.png')}
              style={styles.tastingNoteBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.tastingNoteContent}>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>{t('home.quickMenu.myWineTitle')}</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statNumber}>{myWines.length}</Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>{t('home.quickMenu.bottlesUnit')}</Text>
                  </View>
                </View>
                <View style={styles.arrowIconContainer}>
                  <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>

    {flipping && cardRect && (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={{
            position: 'absolute',
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
              outputRange: [20, 0],
            }),
            overflow: 'hidden',
          }}
        >
          {/* Front face - hero card gradient */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backfaceVisibility: 'hidden',
                transform: [
                  { perspective: 1200 },
                  {
                    rotateY: flipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primaryDark, '#4A086B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Back face - chat screen gradient */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backfaceVisibility: 'hidden',
                transform: [
                  { perspective: 1200 },
                  {
                    rotateY: flipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['180deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primaryDark, '#4A086B', colors.background]}
              locations={[0, 0.35, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
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
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingTop: 20,
    backgroundColor: colors.background, // Keep the very top background the same as the app
    zIndex: 10,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1, // Matte pill color
    borderRadius: 24, // High border radius for pill shape
    height: 52, // Slightly taller for comfortable touch target
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    // Add subtle shadow exactly like the bottom tab bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent to let the pill background show
    paddingHorizontal: 16,
    height: '100%',
  },
  headerSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border, // Subtle vertical line separating search and icon
    marginHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.error,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  quickMenuContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickMenuItem: {
    flex: 1,
    backgroundColor: colors.surface1, // Darker surface matching the theme
    borderRadius: 20,
    height: 140,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)', // Very subtle matte edge
    // Premium 3D float shadow matching the banners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tastingNoteButton: {
    padding: 0,
    // Removed transparent background so the surface2 color shows
  },
  tastingNoteBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tastingNoteContent: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(25, 22, 28, 0.6)',
    borderRadius: 20,
  },
  arrowIconContainer: {
    marginTop: 2,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  menuSubLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  statUnit: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
