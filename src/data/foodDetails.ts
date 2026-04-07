/**
 * Food-specific sommelier lines for the chat flow.
 *
 * Keyed by cuisineIndex → foodIndex, mirroring the order of
 * foodSelection.cuisines in src/i18n/locales/{ko,en}.json.
 *
 * IMPORTANT RULES:
 * - Describe wine *characteristics* only (당도/산도/타닌/바디감, and maybe
 *   탄산감/오크향/과일향). NEVER mention specific grape varieties or regions
 *   (피노 누아, 리슬링, 샤르도네, 샴페인, 부르고뉴 ...). The sommelier's job
 *   here is to analyze the food; the actual grape variety is the downstream
 *   recommendation, matched against the user's taste profile.
 *
 * - If the cuisines order/items order changes in the locale files, update
 *   this table in lockstep.
 *
 * Cuisines index reference:
 *   0 한식  |  1 중식  |  2 일식  |  3 양식  |  4 스페인
 *   5 프랑스 | 6 베트남 | 7 태국 | 8 인도 | 9 멕시코
 *  10 남미  | 11 이탈리아 | 12 아메리칸 차이니즈 | 13 간단안주/스낵 | 14 디저트
 */

export type SupportedLang = 'ko' | 'en';

type FoodDetail = {
  ko: string;
  en: string;
};

// [cuisineIndex][foodIndex] → detail
const FOOD_DETAILS: FoodDetail[][] = [
  // 0 한식
  [
    {
      ko: '삼겹살 드시는군요! 기름지고 육향이 진한 음식이라 타닌이 강하고 바디감이 묵직한 와인이 입안을 깔끔하게 정리해줘요.',
      en: "Samgyeopsal! It's rich and fatty with deep pork flavor, so a wine with bold tannins and a full body cuts through the richness beautifully.",
    },
    {
      ko: '돼지갈비 좋은 선택이에요! 달짝지근한 양념과 기름진 고기엔 과일향이 살아있고 바디감이 중간 정도인 와인이 잘 어울려요.',
      en: 'Pork ribs, great pick! The sweet marinade and juicy meat pair nicely with a fruit-forward wine that has a medium body.',
    },
    {
      ko: '소고기 구이라니 기대되네요! 고소한 지방과 진한 육즙엔 묵직한 타닌과 풍부한 향을 가진 풀바디 레드가 환상의 조합이에요.',
      en: 'Grilled beef — exciting! The savory fat and deep juices call for a wine with firm tannins and a full body for a stunning match.',
    },
    {
      ko: '불고기! 달콤 짭짤한 양념과 부드러운 고기엔 산도가 적당하고 바디감이 중간인 와인이 양념과 고기를 모두 감싸줘요.',
      en: 'Bulgogi! Its sweet-savory marinade and tender beef love a wine with balanced acidity and a medium body that wraps around both.',
    },
    {
      ko: '갈비찜 드시는군요. 진한 간장 양념과 부드럽게 익은 고기엔 타닌이 탄탄하고 바디감이 있는 와인이 잘 맞아요.',
      en: 'Braised short ribs — the deep soy-based marinade and tender meat pair best with a wine that has firm tannins and substantial body.',
    },
    {
      ko: '한식 파인다이닝, 멋진 자리네요! 섬세하게 이어지는 다양한 맛엔 산도와 바디감이 밸런스 좋게 잡힌 와인이 전체 흐름을 이어줘요.',
      en: 'Korean fine dining — what an occasion! The delicate flow of flavors calls for a wine with well-balanced acidity and body to carry the whole course.',
    },
    {
      ko: '한정식 드시는군요! 나물부터 고기까지 다채로운 반찬엔 산도가 깔끔하고 바디감이 가벼운 와인이 부담 없이 어울려요.',
      en: "Hanjeongsik! With everything from vegetables to meat on the table, a wine with clean acidity and a light body works without overwhelming.",
    },
    {
      ko: '곱창·대창! 기름지고 고소한 내장 요리엔 타닌이 강하고 바디감이 묵직한 와인이 느끼함을 잡아줘요.',
      en: 'Gopchang and daechang! These rich, fatty offal dishes need a wine with bold tannins and a heavy body to cut through the richness.',
    },
    {
      ko: '수육·보쌈 드시는군요! 담백한 고기와 새우젓, 김치의 조화엔 산도가 산뜻하고 타닌은 적은 와인이 잘 어울려요.',
      en: "Bossam — boiled pork with shrimp paste and kimchi has a clean savor that loves a wine with bright acidity and gentle tannins.",
    },
    {
      ko: '족발이라니 좋네요! 쫄깃한 식감과 고소한 풍미엔 타닌이 부드럽고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Jokbal, nice choice! Its chewy texture and savory depth pair well with a wine that has soft tannins and a medium body.',
    },
    {
      ko: '닭갈비! 매콤달콤한 양념과 쫄깃한 닭고기엔 당도가 살짝 남아있고 산도가 있는 와인이 매운맛을 달래줘요.',
      en: 'Dakgalbi! The spicy-sweet marinade and chewy chicken pair beautifully with a wine that has a touch of sweetness and bright acidity to cool the heat.',
    },
    {
      ko: '찜닭 드시는군요. 달콤 짭짤한 간장 양념과 부드러운 닭고기엔 과일향이 살아있는 미디엄 바디 레드가 잘 맞아요.',
      en: 'Jjimdak — the sweet-savory soy braise and tender chicken go great with a fruit-forward wine of medium body.',
    },
    {
      ko: '김치찌개! 얼큰하고 시원한 국물엔 산도가 가볍고 당도가 살짝 있는 와인이 매콤함을 중화해줘요.',
      en: 'Kimchi stew! Its spicy, refreshing broth pairs well with a wine that has light acidity and a touch of sweetness to balance the heat.',
    },
    {
      ko: '된장찌개 드시는군요. 구수하고 짭짤한 된장의 감칠맛엔 산도가 살아있는 드라이 화이트가 의외로 잘 어울려요.',
      en: 'Doenjang stew — the earthy, savory umami of fermented soybean surprisingly loves a dry wine with lively acidity.',
    },
    {
      ko: '전 드시는군요! 고소하고 기름진 전엔 산도가 높고 탄산감이 있는 와인이 입안을 깔끔하게 정리해줘요.',
      en: 'Korean pancakes! Their savory, oil-fried richness is best cleansed by a wine with high acidity and lively bubbles.',
    },
    {
      ko: '육회라니 고급지네요! 신선한 생고기엔 타닌이 적고 바디감이 가벼우며 산도가 살아있는 와인이 잘 어울려요.',
      en: 'Yukhoe — fancy! The fresh raw beef pairs best with a wine that has low tannins, a light body, and bright acidity.',
    },
    {
      ko: '간장게장! 짭짤하고 감칠맛 가득한 요리엔 산도가 있고 미네랄리티가 살아있는 드라이한 와인이 잘 맞아요.',
      en: 'Soy-marinated crab! Its salty, umami-packed flavor pairs perfectly with a dry wine that has acidity and lively minerality.',
    },
    {
      ko: '냉면 드시는군요. 시원하고 새콤한 육수엔 산도가 높고 바디감이 가벼운 와인이 청량함을 더해줘요.',
      en: 'Naengmyeon — the cool, tangy broth pairs beautifully with a wine that has high acidity and a light body to amplify the refreshment.',
    },
  ],
  // 1 중식
  [
    {
      ko: '짜장면! 달큼하고 고소한 춘장과 고기 향엔 과일향이 풍부하고 바디감이 중간인 와인이 부담 없이 어울려요.',
      en: 'Jajangmyeon! The sweet, savory black bean sauce with hints of meat pairs easily with a fruit-forward wine of medium body.',
    },
    {
      ko: '짬뽕 드시는군요. 얼큰한 해물 국물엔 당도가 살짝 있고 산도가 높은 와인이 매운맛을 달래줘요.',
      en: 'Jjamppong — the spicy seafood broth pairs nicely with a wine that has a hint of sweetness and high acidity to soothe the heat.',
    },
    {
      ko: '탕수육! 바삭한 튀김과 새콤달콤 소스엔 당도가 살짝 남고 산도가 높은 와인이 환상이에요.',
      en: 'Sweet and sour pork! The crispy fried bites and tangy-sweet sauce love a wine with a touch of sweetness and high acidity.',
    },
    {
      ko: '꿔바로우 드시는군요! 쫀득한 튀김과 달콤 새콤한 소스엔 산뜻한 산도의 오프드라이 와인이 잘 어울려요.',
      en: 'Guobaorou! The chewy fried texture and sweet-sour sauce go well with an off-dry wine that has refreshing acidity.',
    },
    {
      ko: '딤섬! 섬세하고 다양한 맛엔 산도가 가볍고 바디감이 라이트한 와인이 각 요리의 풍미를 살려줘요.',
      en: 'Dim sum! With its delicate variety of flavors, a wine with light acidity and a light body brings out each dish without overpowering.',
    },
    {
      ko: '양꼬치 드시는군요! 향신료 가득한 양고기엔 타닌이 강하고 바디감이 풀바디인 와인이 최고예요.',
      en: 'Lamb skewers! The spice-laden lamb pairs perfectly with a wine that has strong tannins and a full body.',
    },
    {
      ko: '마라탕! 얼얼한 마라향엔 당도가 살짝 있고 산도가 높은 와인이 매운맛을 부드럽게 잡아줘요.',
      en: 'Mala tang! The numbing, spicy heat is gently tamed by a wine with a touch of sweetness and high acidity.',
    },
    {
      ko: '마라샹궈 드시는군요. 강렬한 마라 향신료와 기름진 재료엔 바디감이 있고 타닌이 부드러운 와인이 잘 어울려요.',
      en: 'Mala xiangguo — the intense mala spice and oily ingredients pair well with a wine that has body and soft tannins.',
    },
    {
      ko: '훠궈! 다양한 재료를 담근 향신료 육수엔 당도가 약간 있고 산도가 있는 와인이 잘 맞아요.',
      en: 'Hot pot! The spiced broth simmering with so many ingredients pairs well with a wine that has a touch of sweetness and bright acidity.',
    },
    {
      ko: '북경오리, 정말 특별한 선택이에요! 바삭한 껍질과 진한 풍미엔 타닌이 우아하고 산도가 균형 잡힌 와인이 최고의 조합이에요.',
      en: 'Peking duck — what a special choice! The crispy skin and rich flavor are best matched by a wine with elegant tannins and balanced acidity.',
    },
    {
      ko: '유산슬 드시는군요. 부드러운 해산물과 전분 소스엔 산도가 깔끔한 드라이한 와인이 잘 어울려요.',
      en: 'Yusansul — tender seafood in a starchy sauce pairs well with a dry wine that has clean acidity.',
    },
    {
      ko: '팔보채! 다양한 해산물과 야채의 조화엔 산도가 살아있고 미네랄리티가 있는 드라이한 와인이 맛을 살려줘요.',
      en: 'Palbochae! The mix of seafood and vegetables shines with a dry wine that has lively acidity and minerality.',
    },
    {
      ko: '마파두부 드시는군요. 얼얼한 매운맛과 고소한 두부엔 당도가 살짝 있고 산도가 높은 와인이 잘 어울려요.',
      en: 'Mapo tofu — the numbing spice and savory tofu pair well with a wine that has a hint of sweetness and high acidity.',
    },
    {
      ko: '동파육, 고급진 선택이에요! 달콤 짭짤한 양념과 기름진 삼겹살엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 느끼함을 잡아줘요.',
      en: 'Dongpo pork — a luxurious pick! The sweet-savory glaze and rich pork belly need a wine with firm tannins and a full body to cut through.',
    },
    {
      ko: '궁보계정! 매콤 달콤한 볶음엔 당도가 살짝 있고 산도가 있는 와인이 균형을 맞춰줘요.',
      en: "Kung pao chicken! The spicy-sweet stir-fry is balanced by a wine with a touch of sweetness and bright acidity.",
    },
  ],
  // 2 일식
  [
    {
      ko: '스시 드시는군요! 섬세한 생선의 풍미엔 산도가 높고 미네랄리티가 살아있는 드라이한 와인이 최고예요.',
      en: 'Sushi! The delicate flavors of fresh fish call for a dry wine with high acidity and lively minerality.',
    },
    {
      ko: '오마카세, 특별한 자리네요! 다채로운 코스엔 산도와 바디감이 균형 잡힌 와인이 전체 흐름을 우아하게 이어줘요.',
      en: 'Omakase — a special evening! The diverse course flows best with a wine that has balanced acidity and body.',
    },
    {
      ko: '사시미 드시는군요. 신선한 생선의 담백한 맛엔 산도가 깔끔한 드라이한 와인이 잘 맞아요.',
      en: 'Sashimi — the clean flavor of fresh fish pairs perfectly with a dry wine that has crisp acidity.',
    },
    {
      ko: '라멘! 진한 국물과 쫄깃한 면엔 산도가 가볍고 드라이한 와인이 기름진 국물을 정리해줘요.',
      en: 'Ramen! The rich broth and chewy noodles pair well with a dry wine of light acidity to cleanse the richness.',
    },
    {
      ko: '우동 드시는군요. 담백하고 감칠맛 나는 국물엔 산도가 산뜻한 드라이한 와인이 잘 어울려요.',
      en: 'Udon — the clean, umami broth pairs well with a dry wine that has refreshing acidity.',
    },
    {
      ko: '소바! 구수하고 담백한 메밀엔 산도가 깔끔하고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Soba! The nutty, clean buckwheat pairs well with a wine that has crisp acidity and a light body.',
    },
    {
      ko: '돈카츠 드시는군요! 바삭한 튀김과 진한 소스엔 과일향이 풍부하고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Tonkatsu! The crispy fried cutlet and rich sauce pair well with a fruit-forward wine of medium body.',
    },
    {
      ko: '텐동! 바삭한 튀김과 달콤한 간장 소스엔 산도가 상큼하고 당도가 약간 있는 와인이 기름기를 잡아줘요.',
      en: 'Tendon! The crispy tempura and sweet soy glaze pair well with a wine that has bright acidity and a touch of sweetness to cut the oil.',
    },
    {
      ko: '규동·부타동 드시는군요. 달콤 짭짤한 고기 덮밥엔 과일향이 살아있고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Gyudon or butadon — the sweet-savory meat over rice pairs well with a fruity wine of medium body.',
    },
    {
      ko: '야키토리! 숯불향 가득한 닭꼬치엔 바디감이 중간이고 살짝 스파이스감이 있는 와인이 잘 맞아요.',
      en: 'Yakitori! The smoky charcoal-grilled chicken pairs well with a wine that has medium body and a hint of spice.',
    },
    {
      ko: '스키야키 드시는군요. 간장과 설탕의 달콤한 소고기 전골엔 과일향이 풍부한 미디엄 바디 와인이 잘 어울려요.',
      en: 'Sukiyaki — the sweet soy-and-sugar beef hot pot pairs well with a fruit-forward wine of medium body.',
    },
    {
      ko: '나베·샤브샤브! 담백한 육수와 얇은 고기엔 산도가 가볍고 타닌이 부드러운 와인이 잘 맞아요.',
      en: 'Nabe or shabu shabu! The clean broth and thinly sliced meat pair well with a wine of light acidity and soft tannins.',
    },
    {
      ko: '오코노미야키 드시는군요! 풍성한 재료와 소스엔 산도가 산뜻하고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Okonomiyaki! The rich mix of ingredients and sauce pairs well with a wine of refreshing acidity and a light body.',
    },
    {
      ko: '장어 덮밥! 달콤한 타레 소스와 기름진 장어엔 바디감이 묵직하고 살짝 오크향이 있는 와인이 잘 맞아요.',
      en: 'Eel rice bowl! The sweet tare glaze and rich eel pair well with a full-bodied wine that has subtle oak character.',
    },
  ],
  // 3 양식 (generic)
  [
    {
      ko: '스테이크! 풍부한 육즙과 고소한 지방엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 환상적인 조합을 만들어요.',
      en: 'Steak! The rich juices and savory fat make a stunning match with a wine that has firm tannins and a full body.',
    },
    {
      ko: '파스타 드시는군요. 소스에 따라 다르지만, 보통 산도가 있고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Pasta — it depends on the sauce, but generally a wine with bright acidity and a medium body works best.',
    },
    {
      ko: '피자! 치즈와 토마토 소스, 토핑의 조화엔 과일향이 살아있고 바디감이 중간인 와인이 잘 맞아요.',
      en: 'Pizza! The mix of cheese, tomato sauce, and toppings pairs well with a fruit-forward wine of medium body.',
    },
    {
      ko: '리조또 드시는군요. 크리미한 쌀 요리엔 바디감이 있고 산도가 적당한 드라이한 와인이 풍부한 질감을 살려줘요.',
      en: 'Risotto — the creamy rice dish pairs well with a dry wine that has body and balanced acidity to enhance the texture.',
    },
    {
      ko: '수제버거! 육즙 가득한 패티와 치즈엔 과일향이 풍부하고 바디감이 중간~풀바디인 와인이 잘 어울려요.',
      en: 'Gourmet burger! The juicy patty and melted cheese pair well with a fruit-forward wine of medium to full body.',
    },
    {
      ko: '샐러드 드시는군요. 상큼한 채소와 드레싱엔 산도가 높고 바디감이 가벼운 드라이한 와인이 잘 맞아요.',
      en: 'Salad — the fresh greens and dressing pair well with a dry wine that has high acidity and a light body.',
    },
    {
      ko: '바베큐 폭립! 달콤 짭짤한 소스와 부드러운 돼지고기엔 과일향이 진하고 바디감이 풀바디인 와인이 최고예요.',
      en: 'BBQ ribs! The sweet-savory sauce and tender pork pair perfectly with a wine that has rich fruit and a full body.',
    },
    {
      ko: '피쉬 앤 칩스 드시는군요! 바삭한 튀김엔 산도가 상쾌하고 탄산감이 있는 와인이 입안을 개운하게 해줘요.',
      en: "Fish and chips! The crispy fried bites are best refreshed by a wine with bright acidity and lively bubbles.",
    },
    {
      ko: '브런치라니 여유롭네요! 다양한 메뉴엔 가볍고 상큼한 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Brunch — how relaxing! The varied menu pairs well with a light, refreshing wine that has lively bubbles.',
    },
    {
      ko: '스튜 드시는군요. 진하게 우린 국물엔 바디감이 있고 타닌이 부드러운 와인이 잘 맞아요.',
      en: 'Stew — the deeply simmered broth pairs well with a wine that has body and soft tannins.',
    },
  ],
  // 4 스페인
  [
    {
      ko: '타파스! 다양한 맛을 즐기는 요리엔 산도가 산뜻하고 탄산감이 있는 드라이한 와인이 잘 어울려요.',
      en: 'Tapas! The variety of small plates pairs beautifully with a dry, refreshing wine with lively bubbles.',
    },
    {
      ko: '하몽 드시는군요. 고소하고 짭짤한 풍미엔 바디감이 가볍고 산도가 있는 와인이 풍미를 살려줘요.',
      en: 'Jamón — the savory, salty cured ham pairs well with a wine of light body and bright acidity to bring out the flavor.',
    },
    {
      ko: '감바스! 마늘과 올리브 오일의 풍미엔 산도가 산뜻하고 미네랄리티 있는 드라이한 와인이 최고예요.',
      en: 'Gambas! The garlic and olive oil flavors pair perfectly with a dry wine that has refreshing acidity and minerality.',
    },
    {
      ko: '빠에야 드시는군요. 사프란 향과 해산물의 조화엔 바디감이 있고 산도가 적당한 드라이한 와인이 잘 맞아요.',
      en: 'Paella — the saffron and seafood blend pairs well with a dry wine that has body and balanced acidity.',
    },
    {
      ko: '이베리코! 진한 육향과 고소한 지방엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 환상의 페어링이에요.',
      en: 'Iberico! The deep meat aroma and savory fat make a stunning pairing with a wine of firm tannins and a full body.',
    },
    {
      ko: '츄로스 드시는군요! 달콤한 디저트엔 당도가 높고 바디감이 있는 스위트한 와인이 잘 어울려요.',
      en: 'Churros! This sweet treat pairs best with a sweet wine that has high sugar and body.',
    },
    {
      ko: '가스파초! 상큼한 냉수프엔 산도가 높고 바디감이 가벼운 드라이한 와인이 청량함을 더해줘요.',
      en: 'Gazpacho! The refreshing cold soup pairs well with a dry wine of high acidity and a light body to amplify the freshness.',
    },
    {
      ko: '뽈뽀 드시는군요. 부드러운 문어엔 산도가 있고 미네랄리티가 살아있는 드라이한 와인이 잘 어울려요.',
      en: 'Pulpo — the tender octopus pairs well with a dry wine that has acidity and lively minerality.',
    },
  ],
  // 5 프랑스
  [
    {
      ko: '프랑스 코스 요리라니 멋져요! 섬세한 코스엔 산도가 높고 밸런스가 우아한 와인이 전체 흐름을 이어줘요.',
      en: 'French course dining — wonderful! The delicate progression flows best with a wine of high acidity and elegant balance.',
    },
    {
      ko: '스테이크! 풍부한 육즙엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 환상이에요.',
      en: 'Steak! The rich juices pair perfectly with a wine of firm tannins and a full body.',
    },
    {
      ko: '어니언 스프 드시는군요. 달콤하게 볶은 양파의 깊은 풍미엔 바디감이 있고 오크향이 있는 와인이 잘 맞아요.',
      en: 'French onion soup — the deep, sweetly caramelized onion flavor pairs well with a wine that has body and oak character.',
    },
    {
      ko: '에스카르고, 고급스럽네요! 버터와 허브의 풍미엔 산도가 상쾌하고 바디감이 있는 와인이 잘 어울려요.',
      en: "Escargot — fancy! The buttery, herbal flavors pair well with a wine that has refreshing acidity and body.",
    },
    {
      ko: '푸아그라! 진하고 부드러운 맛엔 당도가 높고 바디감이 있는 스위트한 와인이 전통의 페어링이에요.',
      en: 'Foie gras! Its rich, silky flavor is classically paired with a sweet wine that has high sugar and body.',
    },
    {
      ko: '부야베스 드시는군요. 풍부한 해산물 스튜엔 산도가 있고 바디감이 중간인 드라이한 와인이 잘 어울려요.',
      en: 'Bouillabaisse — the rich seafood stew pairs well with a dry wine that has acidity and a medium body.',
    },
    {
      ko: '꼬꼬뱅! 와인에 조린 닭 요리엔 산도가 높고 타닌이 우아한 와인이 잘 맞아요.',
      en: 'Coq au vin! This wine-braised chicken pairs perfectly with a wine of high acidity and elegant tannins.',
    },
    {
      ko: '타르타르 드시는군요. 신선한 생고기엔 타닌이 적고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Tartare — the fresh raw beef pairs well with a wine of low tannins and a light body.',
    },
    {
      ko: '잠봉뵈르! 버터와 하몽의 조화엔 산도가 산뜻하고 탄산감이 있는 와인이 가볍게 어울려요.',
      en: 'Jambon-beurre! The buttery ham combo pairs nicely with a wine of refreshing acidity and lively bubbles.',
    },
    {
      ko: '크레페 드시는군요! 달콤한 디저트엔 당도가 높고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Crepes! This sweet treat pairs well with a wine that has high sugar and lively bubbles.',
    },
  ],
  // 6 베트남
  [
    {
      ko: '쌀국수 드시는군요! 맑고 깊은 소고기 육수엔 산도가 산뜻하고 바디감이 가벼운 드라이한 와인이 잘 어울려요.',
      en: 'Pho! The clear, deep beef broth pairs well with a dry wine of refreshing acidity and a light body.',
    },
    {
      ko: '분짜! 달콤 짭짤한 느억맘 소스와 숯불 고기엔 당도가 살짝 있고 산도가 있는 와인이 잘 맞아요.',
      en: 'Bun cha! The sweet-savory fish sauce and grilled meat pair well with a wine that has a touch of sweetness and bright acidity.',
    },
    {
      ko: '반미 드시는군요. 다양한 재료가 들어간 바게트엔 산도가 산뜻하고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Banh mi — the loaded baguette pairs well with a wine that has refreshing acidity and lively bubbles.',
    },
    {
      ko: '월남쌈! 신선한 채소와 라이스페이퍼엔 산도가 상큼하고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Vietnamese rice paper rolls! The fresh vegetables and rice wrapper pair well with a wine of bright acidity and a light body.',
    },
    {
      ko: '반쎄오 드시는군요. 바삭한 팬케이크엔 산도가 상쾌한 드라이한 와인이 잘 어울려요.',
      en: 'Banh xeo — the crispy Vietnamese pancake pairs well with a dry wine of refreshing acidity.',
    },
    {
      ko: '짜조! 바삭한 튀김 스프링롤엔 산도가 산뜻하고 당도가 살짝 있는 와인이 기름기를 잡아줘요.',
      en: 'Cha gio! The crispy fried spring rolls pair well with a wine of refreshing acidity and a touch of sweetness to cut the oil.',
    },
    {
      ko: '볶음밥 드시는군요. 고소한 볶음밥엔 과일향이 살아있고 당도가 약간 있는 와인이 잘 어울려요.',
      en: 'Fried rice — the savory dish pairs well with a fruity wine that has a touch of sweetness.',
    },
  ],
  // 7 태국
  [
    {
      ko: '팟타이! 달콤 짭짤 새콤한 볶음 국수엔 산미와 단맛이 균형잡힌 와인이 환상이에요.',
      en: 'Pad thai! The sweet-savory-tangy stir-fried noodles pair perfectly with a wine that balances acidity and sweetness.',
    },
    {
      ko: '똠양꿍 드시는군요! 매콤하고 새콤한 국물엔 당도가 살짝 남고 산도가 높은 와인이 매운맛을 달래줘요.',
      en: 'Tom yum goong! The spicy, tangy broth pairs well with a wine that has a touch of sweetness and high acidity to soothe the heat.',
    },
    {
      ko: '푸팟퐁커리! 진한 카레 소스와 게살엔 바디감이 있고 당도가 약간 있는 와인이 잘 맞아요.',
      en: 'Crab in curry! The rich curry sauce and crab meat pair well with a wine that has body and a touch of sweetness.',
    },
    {
      ko: '쏨땀 드시는군요. 새콤 매콤한 파파야 샐러드엔 산도가 산뜻하고 당도가 살짝 있는 와인이 잘 어울려요.',
      en: 'Som tam — the tangy, spicy papaya salad pairs well with a wine of refreshing acidity and a touch of sweetness.',
    },
    {
      ko: '그린 커리! 매콤한 향신료와 코코넛 밀크엔 당도가 있고 산도가 높은 와인이 잘 맞아요.',
      en: 'Green curry! The spiced coconut milk pairs well with a wine that has sweetness and high acidity.',
    },
    {
      ko: '팟카파오무쌉 드시는군요! 바질 향 가득한 매콤 볶음엔 당도가 살짝 있고 산도가 있는 와인이 매운맛을 달래줘요.',
      en: 'Pad krapow — the basil-laden spicy stir-fry pairs well with a wine that has a touch of sweetness and bright acidity.',
    },
    {
      ko: '얌운센! 새콤 매콤한 당면 샐러드엔 산도가 산뜻하고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Yam woon sen! The tangy, spicy glass noodle salad pairs well with a wine of refreshing acidity and a light body.',
    },
  ],
  // 8 인도
  [
    {
      ko: '치킨 커리! 향신료 가득한 부드러운 커리엔 당도가 있고 산도가 높은 와인이 최고예요.',
      en: 'Chicken curry! The spiced, creamy curry pairs perfectly with a wine that has sweetness and high acidity.',
    },
    {
      ko: '양고기 커리 드시는군요. 진한 향신료와 양고기엔 타닌이 있고 바디감이 풀바디인 와인이 잘 맞아요.',
      en: 'Lamb curry — the deep spices and rich lamb pair well with a wine that has tannins and a full body.',
    },
    {
      ko: '탄두리 치킨! 숯불향과 향신료엔 과일향이 살아있고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Tandoori chicken! The smoky char and spices pair well with a fruity wine of medium body.',
    },
    {
      ko: '난이 좋으신가봐요! 고소하고 담백한 난엔 타닌이 부드럽고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Naan, nice! The savory, simple flatbread pairs well with a wine of soft tannins and a light body.',
    },
    {
      ko: '라씨 드시는군요. 달콤한 요거트 음료엔 당도가 살짝 있고 산도가 있는 와인이 잘 맞아요.',
      en: 'Lassi — the sweet yogurt drink pairs well with a wine that has a touch of sweetness and bright acidity.',
    },
    {
      ko: '사모사! 바삭한 튀김 페이스트리엔 산도가 산뜻하고 탄산감이 있는 와인이 기름기를 잡아줘요.',
      en: 'Samosa! The crispy fried pastry pairs well with a wine of refreshing acidity and lively bubbles to cut the oil.',
    },
    {
      ko: '비리야니 드시는군요! 향신료 가득한 쌀 요리엔 과일향이 풍부하고 당도가 약간 있는 와인이 잘 어울려요.',
      en: 'Biryani! The spiced rice dish pairs well with a fruit-forward wine with a touch of sweetness.',
    },
  ],
  // 9 멕시코
  [
    {
      ko: '타코! 다양한 재료의 조화엔 과일향이 진하고 바디감이 중간인 와인이 잘 맞아요.',
      en: 'Tacos! The mix of fillings pairs well with a fruit-forward wine of medium body.',
    },
    {
      ko: '부리또 드시는군요. 풍성한 재료를 감싼 부리또엔 과일향이 살아있고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Burrito — the loaded wrap pairs well with a fruity wine of medium body.',
    },
    {
      ko: '퀘사디아! 녹은 치즈와 바삭한 또띠야엔 산도가 산뜻하고 탄산감이 있는 와인이 잘 맞아요.',
      en: 'Quesadilla! The melted cheese and crispy tortilla pair well with a wine of refreshing acidity and lively bubbles.',
    },
    {
      ko: '파히타 드시는군요. 숯불향 가득한 고기와 야채엔 스파이스감이 있고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Fajitas — the smoky grilled meat and vegetables pair well with a wine that has spice notes and a medium body.',
    },
    {
      ko: '나초! 바삭한 토르티야 칩엔 산도가 있고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Nachos! The crispy tortilla chips pair well with a wine of bright acidity and a light body.',
    },
    {
      ko: '엔칠라다 드시는군요. 매콤한 소스와 치즈엔 과일향이 진하고 당도가 살짝 있는 와인이 잘 어울려요.',
      en: 'Enchiladas — the spicy sauce and cheese pair well with a wine that has rich fruit and a touch of sweetness.',
    },
    {
      ko: '과카몰리! 부드러운 아보카도엔 산도가 산뜻하고 드라이한 와인이 잘 맞아요.',
      en: 'Guacamole! The creamy avocado pairs well with a dry wine of refreshing acidity.',
    },
  ],
  // 10 남미
  [
    {
      ko: '슈라스코! 숯불향 가득한 다양한 고기엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 환상이에요.',
      en: 'Churrasco! The smoky charcoal-grilled meats pair perfectly with a wine of firm tannins and a full body.',
    },
    {
      ko: '아사도 드시는군요. 숯불에 구운 진한 고기엔 타닌이 묵직하고 바디감이 풀바디인 와인이 최고의 선택이에요.',
      en: 'Asado — the deeply char-grilled meat pairs perfectly with a wine of bold tannins and a full body.',
    },
    {
      ko: '세비체! 신선한 해산물의 새콤한 마리네이드엔 산도가 산뜻하고 드라이한 와인이 잘 맞아요.',
      en: 'Ceviche! The fresh seafood with tangy marinade pairs well with a dry wine of refreshing acidity.',
    },
    {
      ko: '엠파나다 드시는군요. 바삭한 페이스트리엔 과일향이 살아있고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Empanadas — the crispy pastry pairs well with a fruity wine of light body.',
    },
    {
      ko: '남미식 타코! 향긋한 고수와 라임의 풍미엔 산도가 산뜻하고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Latin-style tacos! The cilantro and lime aromas pair well with a wine of refreshing acidity and a light body.',
    },
  ],
  // 11 이탈리아
  [
    {
      ko: '토마토 파스타! 산미가 있는 토마토 소스엔 같은 산도를 가진 와인이 최고예요.',
      en: 'Tomato pasta! The tangy tomato sauce calls for a wine with matching acidity.',
    },
    {
      ko: '크림 파스타 드시는군요. 진한 크림 소스엔 바디감이 있고 오크향이 있는 와인이 풍부한 질감을 살려줘요.',
      en: 'Cream pasta — the rich sauce pairs well with a wine that has body and oak character to enhance the texture.',
    },
    {
      ko: '오일 파스타! 깔끔한 올리브 오일 기반엔 산도가 산뜻하고 드라이한 와인이 잘 맞아요.',
      en: 'Oil-based pasta! The clean olive oil base pairs well with a dry wine of refreshing acidity.',
    },
    {
      ko: '화덕 피자! 바삭한 도우와 다양한 토핑엔 과일향이 살아있고 바디감이 중간인 와인이 환상이에요.',
      en: 'Wood-fired pizza! The crispy crust and varied toppings pair perfectly with a fruity wine of medium body.',
    },
    {
      ko: '리조또 드시는군요. 크리미한 쌀 요리엔 바디감이 있고 드라이한 와인이 풍부한 질감을 살려줘요.',
      en: 'Risotto — the creamy rice dish pairs well with a dry wine that has body to enhance the texture.',
    },
    {
      ko: '뇨끼! 쫄깃한 감자 파스타엔 과일향이 풍부하고 바디감이 중간인 와인이 잘 어울려요.',
      en: 'Gnocchi! The chewy potato pasta pairs well with a fruit-forward wine of medium body.',
    },
    {
      ko: '라자냐 드시는군요. 진한 미트소스와 치즈엔 바디감이 있고 산도가 적당한 와인이 잘 맞아요.',
      en: 'Lasagna — the rich meat sauce and cheese pair well with a wine that has body and balanced acidity.',
    },
    {
      ko: '티본 스테이크! 풍부한 육즙엔 타닌이 탄탄하고 바디감이 풀바디인 와인이 최고예요.',
      en: 'T-bone steak! The rich juices pair perfectly with a wine of firm tannins and a full body.',
    },
    {
      ko: '카르파치오 드시는군요. 얇게 썬 생고기엔 타닌이 적고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Carpaccio — thinly sliced raw beef pairs well with a wine of low tannins and a light body.',
    },
    {
      ko: '티라미수! 커피와 마스카포네의 조화엔 당도가 높고 탄산감이 있는 와인이 환상이에요.',
      en: 'Tiramisu! The coffee and mascarpone pair perfectly with a sweet wine with lively bubbles.',
    },
    {
      ko: '젤라또 드시는군요. 부드럽고 달콤한 디저트엔 당도가 높은 스위트한 와인이 잘 어울려요.',
      en: 'Gelato — the smooth, sweet treat pairs well with a sweet wine.',
    },
  ],
  // 12 아메리칸 차이니즈
  [
    {
      ko: '오렌지 치킨! 달콤 새콤한 소스엔 당도가 살짝 있고 산도가 높은 와인이 환상이에요.',
      en: 'Orange chicken! The sweet-tangy sauce pairs perfectly with a wine that has a touch of sweetness and high acidity.',
    },
    {
      ko: '몽골리안 비프 드시는군요. 달콤 짭짤한 소스와 소고기엔 과일향이 진하고 바디감이 중간인 와인이 잘 맞아요.',
      en: 'Mongolian beef — the sweet-savory sauce and beef pair well with a fruit-forward wine of medium body.',
    },
    {
      ko: '차오면! 볶은 면 요리엔 산도가 산뜻하고 드라이한 와인이 잘 어울려요.',
      en: 'Chow mein! The stir-fried noodles pair well with a dry wine of refreshing acidity.',
    },
    {
      ko: '쿵파오 치킨 드시는군요! 매콤 달콤한 볶음엔 과일향이 풍부하고 산도가 높은 와인이 매운맛을 달래줘요.',
      en: 'Kung pao chicken! The spicy-sweet stir-fry pairs well with a fruit-forward wine of high acidity to tame the heat.',
    },
    {
      ko: '제너럴 쏘 치킨! 달콤 매콤한 튀김엔 당도가 살짝 있고 산도가 있는 와인이 잘 맞아요.',
      en: "General Tso's chicken! The sweet-spicy fried pieces pair well with a wine that has a touch of sweetness and bright acidity.",
    },
    {
      ko: '에그롤 드시는군요. 바삭한 튀김 롤엔 산도가 산뜻하고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Egg rolls — the crispy fried rolls pair well with a wine of refreshing acidity and lively bubbles.',
    },
    {
      ko: '미국식 마파두부! 향신료와 두부의 조화엔 과일향이 풍부하고 당도가 약간 있는 와인이 잘 맞아요.',
      en: 'American mapo tofu! The spiced tofu pairs well with a fruity wine that has a touch of sweetness.',
    },
    {
      ko: '완탕 드시는군요. 부드러운 만두엔 산도가 산뜻한 드라이한 와인이 잘 어울려요.',
      en: 'Wonton — the tender dumplings pair well with a dry wine of refreshing acidity.',
    },
  ],
  // 13 간단안주/스낵
  [
    {
      ko: '모듬치즈! 다양한 치즈의 풍미엔 치즈마다 다르지만 보통 산도와 바디감이 균형 잡힌 와인이 잘 맞아요.',
      en: 'Cheese plate! It varies by cheese, but a wine with balanced acidity and body usually works well.',
    },
    {
      ko: '제철과일 드시는군요. 상큼한 과일엔 산도가 산뜻하고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Seasonal fruit — the fresh sweetness pairs well with a wine of refreshing acidity and lively bubbles.',
    },
    {
      ko: '하몽이라니 좋아요! 고소하고 짭짤한 하몽엔 바디감이 가볍고 산도가 있는 와인이 풍미를 살려줘요.',
      en: 'Jamón, nice! The savory, salty cured ham pairs well with a wine of light body and bright acidity.',
    },
    {
      ko: '샤퀴테리 드시는군요! 다양한 염장 육류엔 산도가 있고 바디감이 가벼운 와인이 잘 맞아요.',
      en: 'Charcuterie! The cured meats pair well with a wine of bright acidity and a light body.',
    },
    {
      ko: '나초! 바삭한 토르티야 칩엔 산도가 있고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Nachos! The crispy tortilla chips pair well with a wine of bright acidity and a light body.',
    },
    {
      ko: '감자칩 드시는군요! 짭짤한 스낵엔 의외로 산도가 높고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Potato chips! Surprisingly, salty snacks pair beautifully with a wine of high acidity and lively bubbles.',
    },
    {
      ko: '견과류! 고소한 견과류엔 오크향이 있고 바디감이 있는 와인이 잘 맞아요.',
      en: 'Nuts! The savory crunch pairs well with a wine that has oak character and body.',
    },
    {
      ko: '육포 드시는군요. 쫄깃하고 진한 육향엔 타닌이 있고 바디감이 있는 와인이 잘 어울려요.',
      en: 'Beef jerky — the chewy, deep meat flavor pairs well with a wine that has tannins and body.',
    },
    {
      ko: '마른안주! 짭짤하고 담백한 안주엔 산도가 산뜻하고 드라이한 와인이 가볍게 어울려요.',
      en: 'Dried snacks! The salty, simple bites pair lightly with a dry wine of refreshing acidity.',
    },
    {
      ko: '올리브 드시는군요. 짭짤하고 풍미 좋은 올리브엔 산도가 있고 드라이한 와인이 잘 맞아요.',
      en: 'Olives — their salty, savory flavor pairs well with a dry wine of bright acidity.',
    },
  ],
  // 14 디저트
  [
    {
      ko: '케이크 드시는군요! 달콤한 케이크엔 당도가 있고 바디감이 부드러운 와인이 잘 어울려요.',
      en: 'Cake! The sweetness pairs well with a wine that has sugar and a soft body.',
    },
    {
      ko: '타르트! 바삭한 크러스트와 달콤한 필링엔 당도가 높고 산도가 있는 와인이 잘 맞아요.',
      en: 'Tart! The crispy crust and sweet filling pair well with a wine of high sugar and bright acidity.',
    },
    {
      ko: '초콜릿 드시는군요. 진한 초콜릿엔 당도가 높고 바디감이 묵직한 와인이 환상의 페어링이에요.',
      en: 'Chocolate — the rich flavor makes a stunning pairing with a sweet wine of full body.',
    },
    {
      ko: '마카롱! 섬세하고 달콤한 마카롱엔 당도가 약간 있고 탄산감이 있는 와인이 잘 어울려요.',
      en: 'Macarons! The delicate sweetness pairs well with a wine that has a touch of sugar and lively bubbles.',
    },
    {
      ko: '아이스크림 드시는군요! 차갑고 달콤한 디저트엔 당도가 높고 바디감이 있는 와인이 잘 맞아요.',
      en: 'Ice cream! The cold, sweet treat pairs well with a wine of high sugar and body.',
    },
    {
      ko: '빵! 담백하고 고소한 빵엔 산도가 있고 바디감이 가벼운 와인이 잘 어울려요.',
      en: 'Bread! The simple, savory loaf pairs well with a wine of bright acidity and a light body.',
    },
    {
      ko: '쿠키 드시는군요. 달콤한 쿠키엔 당도가 높고 탄산감이 있는 와인이 잘 맞아요.',
      en: 'Cookies — the sweet bites pair well with a wine of high sugar and lively bubbles.',
    },
  ],
];

/**
 * Returns the sommelier's food-specific intro line.
 * Falls back to a generic template if no entry is found.
 */
export const getFoodDetail = (
  cuisineIndex: number,
  foodIndex: number,
  lang: SupportedLang,
  displayFoodName: string,
): string => {
  const entry = FOOD_DETAILS[cuisineIndex]?.[foodIndex];
  if (entry) {
    if (lang === 'en') return entry.en;
    return entry.ko;
  }
  if (lang === 'en') {
    return `Going with ${displayFoodName}! Let me find a wine that matches its character.`;
  }
  return `${displayFoodName} 드시는군요! 이 음식에 어울리는 와인을 찾아볼게요.`;
};
