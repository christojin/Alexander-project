import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============================================
  // PLATFORM SETTINGS
  // ============================================
  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "VirtuMall",
      defaultCommissionRate: 10.0,
      buyerServiceFeeFixed: 0.5,
      buyerServiceFeePercent: 3.0,
      enableStripe: true,
      enableQrBolivia: true,
      enableBinancePay: true,
      enableCrypto: true,
      deliveryDelayMinutes: 0,
      highValueThreshold: 100,
      requireManualReviewAbove: 500,
      bannerIntervalSeconds: 5,
    },
  });
  console.log("✅ Platform settings created");

  // ============================================
  // CURRENCIES
  // ============================================
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: "USD" },
      update: {},
      create: { name: "US Dollar", code: "USD", symbol: "$", exchangeRate: 1.0 },
    }),
    prisma.currency.upsert({
      where: { code: "BOB" },
      update: {},
      create: { name: "Boliviano", code: "BOB", symbol: "Bs", exchangeRate: 6.91 },
    }),
  ]);
  console.log(`✅ ${currencies.length} currencies created`);

  // ============================================
  // REGIONS
  // ============================================
  const regionsData = [
    { name: "Global", code: "GLOBAL", flagEmoji: "🌎", displayOrder: 0 },
    { name: "Bolivia", code: "BO", flagEmoji: "🇧🇴", displayOrder: 1 },
    { name: "United States", code: "US", flagEmoji: "🇺🇸", displayOrder: 2 },
    { name: "Europe", code: "EU", flagEmoji: "🇪🇺", displayOrder: 3 },
    { name: "Latin America", code: "LATAM", flagEmoji: "🌎", displayOrder: 4 },
    { name: "Brazil", code: "BR", flagEmoji: "🇧🇷", displayOrder: 5 },
    { name: "Argentina", code: "AR", flagEmoji: "🇦🇷", displayOrder: 6 },
    { name: "Colombia", code: "CO", flagEmoji: "🇨🇴", displayOrder: 7 },
    { name: "Turkey", code: "TR", flagEmoji: "🇹🇷", displayOrder: 8 },
  ];

  const regions: Record<string, { id: string }> = {};
  for (const r of regionsData) {
    regions[r.code] = await prisma.region.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }
  console.log(`✅ ${regionsData.length} regions created`);

  // ============================================
  // CATEGORIES
  // ============================================
  const categoriesData = [
    { name: "Gift Cards", slug: "gift-cards", description: "Digital gift cards for popular stores and services", icon: "CreditCard", displayOrder: 1 },
    { name: "Streaming", slug: "streaming", description: "Streaming service accounts and subscriptions", icon: "Tv", displayOrder: 2 },
    { name: "Gaming", slug: "gaming", description: "Game codes, top-ups, and in-game currency", icon: "Gamepad2", displayOrder: 3 },
    { name: "Software", slug: "software", description: "Software licenses and digital subscriptions", icon: "Monitor", displayOrder: 4 },
    { name: "Mobile Top-Up", slug: "mobile-topup", description: "Mobile phone credit and data recharges", icon: "Smartphone", displayOrder: 5 },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const c of categoriesData) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`✅ ${categoriesData.length} categories created`);

  // ============================================
  // BRANDS
  // ============================================
  const brandsData = [
    { name: "Netflix", slug: "netflix", logo: "/images/netflix.svg", displayOrder: 1 },
    { name: "Spotify", slug: "spotify", logo: "/images/spotify.svg", displayOrder: 2 },
    { name: "Disney+", slug: "disney-plus", logo: "/images/disney.svg", displayOrder: 3 },
    { name: "Amazon", slug: "amazon", logo: "/images/amazon.svg", displayOrder: 4 },
    { name: "Steam", slug: "steam", logo: "/images/steam.svg", displayOrder: 5 },
    { name: "PlayStation", slug: "playstation", logo: "/images/playstation.svg", displayOrder: 6 },
    { name: "Xbox", slug: "xbox", logo: "/images/xbox.svg", displayOrder: 7 },
    { name: "Free Fire", slug: "free-fire", logo: "/images/freefire.svg", displayOrder: 8 },
    { name: "PUBG Mobile", slug: "pubg-mobile", logo: "/images/pubg.svg", displayOrder: 9 },
    { name: "Roblox", slug: "roblox", logo: "/images/roblox.svg", displayOrder: 10 },
    { name: "HBO Max", slug: "hbo-max", logo: "/images/hbo.svg", displayOrder: 11 },
    { name: "YouTube Premium", slug: "youtube-premium", displayOrder: 12 },
    { name: "Apple", slug: "apple", logo: "/images/apple.svg", displayOrder: 13 },
    { name: "Google Play", slug: "google-play", logo: "/images/google-play.svg", displayOrder: 14 },
  ];

  const brands: Record<string, { id: string }> = {};
  for (const b of brandsData) {
    brands[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }
  console.log(`✅ ${brandsData.length} brands created`);

  // ============================================
  // USERS: ADMIN + DEMO SELLERS + DEMO BUYER
  // ============================================
  const passwordHash = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@virtumall.com" },
    update: {},
    create: {
      name: "Admin VirtuMall",
      email: "admin@virtumall.com",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Admin user created (admin@virtumall.com / password123)");

  const seller1User = await prisma.user.upsert({
    where: { email: "carlos@tiendadigital.bo" },
    update: {},
    create: {
      name: "Carlos Mendoza",
      email: "carlos@tiendadigital.bo",
      passwordHash,
      role: "SELLER",
      isActive: true,
    },
  });

  const seller2User = await prisma.user.upsert({
    where: { email: "maria@giftzone.com" },
    update: {},
    create: {
      name: "María González",
      email: "maria@giftzone.com",
      passwordHash,
      role: "SELLER",
      isActive: true,
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: {
      name: "Test Buyer",
      email: "buyer@test.com",
      passwordHash,
      role: "BUYER",
      isActive: true,
    },
  });
  console.log("✅ Demo users created (seller x2, buyer x1)");

  // ============================================
  // SELLER PROFILES
  // ============================================
  const seller1 = await prisma.sellerProfile.upsert({
    where: { userId: seller1User.id },
    update: {},
    create: {
      userId: seller1User.id,
      storeName: "Tienda Digital Bolivia",
      slug: "tienda-digital-bolivia",
      storeDescription: "La mejor tienda de gift cards y cuentas streaming en Bolivia. Entrega inmediata y soporte 24/7.",
      commissionRate: 10.0,
      rating: 4.8,
      totalReviews: 342,
      totalSales: 1580,
      totalEarnings: 45230.50,
      availableBalance: 2150.00,
      status: "APPROVED",
      marketType: "MIXED",
      countryId: regions["BO"].id,
      isVerified: true,
    },
  });

  const seller2 = await prisma.sellerProfile.upsert({
    where: { userId: seller2User.id },
    update: {},
    create: {
      userId: seller2User.id,
      storeName: "GiftZone Premium",
      slug: "giftzone-premium",
      storeDescription: "Premium digital gift cards and streaming accounts. Fast delivery, competitive prices.",
      commissionRate: 10.0,
      rating: 4.6,
      totalReviews: 215,
      totalSales: 890,
      totalEarnings: 28450.00,
      availableBalance: 1320.50,
      status: "APPROVED",
      marketType: "GIFT_CARDS",
      countryId: regions["US"].id,
      isVerified: true,
    },
  });
  console.log("✅ Seller profiles created (2 approved sellers)");

  // ============================================
  // SELLER BUSINESS HOURS
  // ============================================
  for (const seller of [seller1, seller2]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.sellerBusinessHours.upsert({
        where: { sellerId_dayOfWeek: { sellerId: seller.id, dayOfWeek: day } },
        update: {},
        create: {
          sellerId: seller.id,
          dayOfWeek: day,
          openTime: day === 0 ? "10:00" : "09:00",
          closeTime: day === 0 ? "14:00" : "18:00",
          isClosed: false,
        },
      });
    }
  }
  console.log("✅ Business hours created for both sellers");

  // ============================================
  // PRODUCTS
  // ============================================
  const productsData = [
    // Seller 1 - Gift Cards
    {
      name: "Netflix Gift Card $25",
      slug: "netflix-gift-card-25",
      description: "Tarjeta de regalo Netflix por $25 USD. Válida en cualquier cuenta Netflix. Se aplica automáticamente al saldo de tu cuenta.",
      price: 24.99,
      originalPrice: 25.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 50,
      soldCount: 234,
      sellerId: seller1.id,
      categoryId: categories["gift-cards"].id,
      brandId: brands["netflix"].id,
      regionId: regions["GLOBAL"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "Spotify Premium 3 Meses",
      slug: "spotify-premium-3-meses",
      description: "Código de suscripción Spotify Premium por 3 meses. Música sin anuncios, descarga offline y calidad alta.",
      price: 29.99,
      originalPrice: 32.97,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 30,
      soldCount: 189,
      sellerId: seller1.id,
      categoryId: categories["gift-cards"].id,
      brandId: brands["spotify"].id,
      regionId: regions["LATAM"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "Steam Wallet $50",
      slug: "steam-wallet-50",
      description: "Recarga tu billetera Steam con $50 USD. Compra juegos, DLC, hardware y más en la tienda Steam.",
      price: 49.50,
      originalPrice: 50.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 25,
      soldCount: 156,
      sellerId: seller1.id,
      categoryId: categories["gaming"].id,
      brandId: brands["steam"].id,
      regionId: regions["US"].id,
      isActive: true,
      isPromoted: true,
    },
    // Seller 1 - Streaming Accounts
    {
      name: "Netflix Premium Cuenta Completa",
      slug: "netflix-premium-cuenta-completa",
      description: "Cuenta Netflix Premium 4K UHD. Acceso completo con 4 pantallas simultáneas. Duración 30 días con renovación disponible.",
      price: 8.99,
      productType: "STREAMING" as const,
      deliveryType: "INSTANT" as const,
      streamingMode: "COMPLETE_ACCOUNT" as const,
      duration: 30,
      stockCount: 15,
      soldCount: 412,
      sellerId: seller1.id,
      categoryId: categories["streaming"].id,
      brandId: brands["netflix"].id,
      regionId: regions["TR"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "Netflix Perfil Individual",
      slug: "netflix-perfil-individual",
      description: "Perfil individual en cuenta Netflix Premium 4K. Tu propio perfil con historial separado. No cambiar contraseña ni PIN.",
      price: 3.50,
      productType: "STREAMING" as const,
      deliveryType: "INSTANT" as const,
      streamingMode: "PROFILE" as const,
      profileCount: 4,
      duration: 30,
      stockCount: 20,
      soldCount: 567,
      sellerId: seller1.id,
      categoryId: categories["streaming"].id,
      brandId: brands["netflix"].id,
      regionId: regions["TR"].id,
      isActive: true,
    },
    {
      name: "Spotify Perfil Familiar",
      slug: "spotify-perfil-familiar",
      description: "Perfil en plan familiar Spotify Premium. Música sin anuncios, descarga offline. No modificar la cuenta principal.",
      price: 2.99,
      productType: "STREAMING" as const,
      deliveryType: "INSTANT" as const,
      streamingMode: "PROFILE" as const,
      profileCount: 5,
      duration: 30,
      stockCount: 25,
      soldCount: 389,
      sellerId: seller1.id,
      categoryId: categories["streaming"].id,
      brandId: brands["spotify"].id,
      regionId: regions["LATAM"].id,
      isActive: true,
    },
    // Seller 1 - Top-Ups
    {
      name: "Free Fire 1080 Diamantes",
      slug: "free-fire-1080-diamantes",
      description: "Recarga de 1080 diamantes para Free Fire. Necesitas proporcionar tu ID de jugador. Entrega en 5-30 minutos.",
      price: 9.99,
      productType: "TOP_UP" as const,
      deliveryType: "MANUAL" as const,
      duration: 30,
      stockCount: 100,
      soldCount: 723,
      sellerId: seller1.id,
      categoryId: categories["gaming"].id,
      brandId: brands["free-fire"].id,
      regionId: regions["LATAM"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "PUBG Mobile 660 UC",
      slug: "pubg-mobile-660-uc",
      description: "660 Unknown Cash para PUBG Mobile. Proporciona tu ID de jugador. Recarga manual en 5-30 minutos.",
      price: 9.99,
      productType: "TOP_UP" as const,
      deliveryType: "MANUAL" as const,
      duration: 30,
      stockCount: 80,
      soldCount: 445,
      sellerId: seller1.id,
      categoryId: categories["gaming"].id,
      brandId: brands["pubg-mobile"].id,
      regionId: regions["GLOBAL"].id,
      isActive: true,
    },
    // Seller 2 - Gift Cards
    {
      name: "Amazon Gift Card $50",
      slug: "amazon-gift-card-50",
      description: "Amazon.com gift card worth $50 USD. Can be applied to any Amazon.com account. Instant email delivery.",
      price: 49.50,
      originalPrice: 50.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 40,
      soldCount: 312,
      sellerId: seller2.id,
      categoryId: categories["gift-cards"].id,
      brandId: brands["amazon"].id,
      regionId: regions["US"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "PlayStation Store $25",
      slug: "playstation-store-25",
      description: "PlayStation Store gift card $25 USD. Buy games, DLC, subscriptions and more on PS4/PS5.",
      price: 24.50,
      originalPrice: 25.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 35,
      soldCount: 198,
      sellerId: seller2.id,
      categoryId: categories["gaming"].id,
      brandId: brands["playstation"].id,
      regionId: regions["US"].id,
      isActive: true,
    },
    {
      name: "Xbox Game Pass Ultimate 1 Month",
      slug: "xbox-game-pass-ultimate-1-month",
      description: "Xbox Game Pass Ultimate subscription code for 1 month. Includes Game Pass, Xbox Live Gold, and EA Play.",
      price: 14.99,
      originalPrice: 16.99,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 20,
      soldCount: 145,
      sellerId: seller2.id,
      categoryId: categories["gaming"].id,
      brandId: brands["xbox"].id,
      regionId: regions["US"].id,
      isActive: true,
    },
    {
      name: "Roblox 800 Robux",
      slug: "roblox-800-robux",
      description: "Roblox gift card for 800 Robux. Redeem on Roblox.com or the Roblox app.",
      price: 9.99,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 45,
      soldCount: 267,
      sellerId: seller2.id,
      categoryId: categories["gaming"].id,
      brandId: brands["roblox"].id,
      regionId: regions["GLOBAL"].id,
      isActive: true,
    },
    // Seller 2 - Streaming
    {
      name: "Disney+ Premium Account",
      slug: "disney-plus-premium-account",
      description: "Disney+ Premium account with 4K UHD streaming. Full access to Disney, Pixar, Marvel, Star Wars content. 30 days.",
      price: 5.99,
      productType: "STREAMING" as const,
      deliveryType: "INSTANT" as const,
      streamingMode: "COMPLETE_ACCOUNT" as const,
      duration: 30,
      stockCount: 10,
      soldCount: 178,
      sellerId: seller2.id,
      categoryId: categories["streaming"].id,
      brandId: brands["disney-plus"].id,
      regionId: regions["LATAM"].id,
      isActive: true,
      isPromoted: true,
    },
    {
      name: "HBO Max Account",
      slug: "hbo-max-account",
      description: "HBO Max complete account. Stream movies, series, and HBO originals in HD. Valid for 30 days.",
      price: 4.99,
      productType: "STREAMING" as const,
      deliveryType: "INSTANT" as const,
      streamingMode: "COMPLETE_ACCOUNT" as const,
      duration: 30,
      stockCount: 8,
      soldCount: 134,
      sellerId: seller2.id,
      categoryId: categories["streaming"].id,
      brandId: brands["hbo-max"].id,
      regionId: regions["LATAM"].id,
      isActive: true,
    },
    // Seller 2 - Apple / Google Play
    {
      name: "Apple Gift Card $25",
      slug: "apple-gift-card-25",
      description: "Apple Gift Card $25 USD. Use for App Store, Apple Music, iCloud+, and more. Works with any Apple ID.",
      price: 24.75,
      originalPrice: 25.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 30,
      soldCount: 201,
      sellerId: seller2.id,
      categoryId: categories["gift-cards"].id,
      brandId: brands["apple"].id,
      regionId: regions["US"].id,
      isActive: true,
    },
    {
      name: "Google Play $15",
      slug: "google-play-15",
      description: "Google Play gift card $15 USD. Buy apps, games, movies, books, and subscriptions.",
      price: 14.75,
      originalPrice: 15.00,
      productType: "GIFT_CARD" as const,
      deliveryType: "INSTANT" as const,
      stockCount: 35,
      soldCount: 178,
      sellerId: seller2.id,
      categoryId: categories["gift-cards"].id,
      brandId: brands["google-play"].id,
      regionId: regions["GLOBAL"].id,
      isActive: true,
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${productsData.length} products created`);

  // ============================================
  // SAMPLE INVENTORY: GIFT CARD CODES
  // ============================================
  const netflixProduct = await prisma.product.findUnique({ where: { slug: "netflix-gift-card-25" } });
  const steamProduct = await prisma.product.findUnique({ where: { slug: "steam-wallet-50" } });
  const amazonProduct = await prisma.product.findUnique({ where: { slug: "amazon-gift-card-50" } });

  if (netflixProduct && steamProduct && amazonProduct) {
    const sampleCodes = [
      // Netflix codes
      ...Array.from({ length: 5 }, (_, i) => ({
        productId: netflixProduct.id,
        codeEncrypted: `ENC:NFLX-XXXX-${String(i + 1).padStart(4, "0")}`,
        status: "AVAILABLE" as const,
      })),
      // Steam codes
      ...Array.from({ length: 5 }, (_, i) => ({
        productId: steamProduct.id,
        codeEncrypted: `ENC:STEAM-XXXX-${String(i + 1).padStart(4, "0")}`,
        status: "AVAILABLE" as const,
      })),
      // Amazon codes
      ...Array.from({ length: 5 }, (_, i) => ({
        productId: amazonProduct.id,
        codeEncrypted: `ENC:AMZN-XXXX-${String(i + 1).padStart(4, "0")}`,
        status: "AVAILABLE" as const,
      })),
    ];

    for (const code of sampleCodes) {
      await prisma.giftCardCode.create({ data: code });
    }
    console.log(`✅ ${sampleCodes.length} sample gift card codes created`);
  }

  // ============================================
  // SAMPLE INVENTORY: STREAMING ACCOUNTS
  // ============================================
  const netflixAccount = await prisma.product.findUnique({ where: { slug: "netflix-premium-cuenta-completa" } });
  const netflixProfile = await prisma.product.findUnique({ where: { slug: "netflix-perfil-individual" } });
  const disneyProduct = await prisma.product.findUnique({ where: { slug: "disney-plus-premium-account" } });

  if (netflixAccount) {
    for (let i = 1; i <= 3; i++) {
      await prisma.streamingAccount.create({
        data: {
          productId: netflixAccount.id,
          emailEncrypted: `ENC:netflix_user${i}@email.com`,
          passwordEncrypted: `ENC:securepass${i}`,
          maxProfiles: 1,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log("✅ 3 Netflix complete accounts created");
  }

  if (netflixProfile) {
    const sharedAccount = await prisma.streamingAccount.create({
      data: {
        productId: netflixProfile.id,
        emailEncrypted: "ENC:netflix_shared@email.com",
        passwordEncrypted: "ENC:sharedpass1",
        maxProfiles: 4,
        soldProfiles: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    for (let p = 1; p <= 4; p++) {
      await prisma.streamingProfile.create({
        data: {
          streamingAccountId: sharedAccount.id,
          profileNumber: p,
        },
      });
    }
    console.log("✅ 1 Netflix shared account with 4 profiles created");
  }

  if (disneyProduct) {
    for (let i = 1; i <= 2; i++) {
      await prisma.streamingAccount.create({
        data: {
          productId: disneyProduct.id,
          emailEncrypted: `ENC:disney_user${i}@email.com`,
          passwordEncrypted: `ENC:disneypass${i}`,
          maxProfiles: 1,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log("✅ 2 Disney+ accounts created");
  }

  // ============================================
  // BANNERS
  // ============================================
  await Promise.all([
    prisma.banner.create({
      data: {
        title: "Recarga Directa por ID",
        subtitle: "Vemper Games",
        description: "Free Fire, Genshin Impact, Honor of Kings y mas",
        imageUrl: "/images/banners/banner-gaming.jpg",
        linkUrl: "/products?category=gaming",
        bgColor: "from-purple-700 via-indigo-700 to-blue-800",
        brandImages: ["/images/freefire.svg", "/images/pubg.svg", "/images/fortnite.svg", "/images/roblox.svg"],
        displayOrder: 1,
        isActive: true,
      },
    }),
    prisma.banner.create({
      data: {
        title: "Gift Cards Internacionales",
        subtitle: "Las mejores marcas",
        description: "Netflix, Spotify, PlayStation, Steam y mas",
        imageUrl: "/images/banners/banner-giftcards.jpg",
        linkUrl: "/products?category=gift-cards",
        bgColor: "from-blue-700 via-cyan-700 to-teal-800",
        brandImages: ["/images/netflix.svg", "/images/spotify.svg", "/images/playstation.svg", "/images/steam.svg"],
        displayOrder: 2,
        isActive: true,
      },
    }),
    prisma.banner.create({
      data: {
        title: "Paga con QR Bolivia",
        subtitle: "Metodo principal",
        description: "Sin necesidad de dolares ni tarjeta internacional",
        imageUrl: "/images/banners/banner-qr.jpg",
        linkUrl: "/products",
        bgColor: "from-green-700 via-emerald-700 to-teal-800",
        brandImages: ["/images/amazon.svg", "/images/xbox.svg", "/images/disney.svg", "/images/google-play.svg"],
        displayOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log("✅ 3 banners created");

  // ============================================
  // WELCOME ANNOUNCEMENT
  // ============================================
  await prisma.announcement.create({
    data: {
      title: "Bienvenido a VirtuMall",
      content: "La plataforma #1 de Bolivia para gift cards, cuentas streaming y recargas gaming. Compra seguro con múltiples métodos de pago.",
      target: "ALL",
      isActive: true,
    },
  });
  console.log("✅ Welcome announcement created");

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n========================================");
  console.log("🎉 Seed completed successfully!");
  console.log("========================================");
  console.log("\nDemo accounts:");
  console.log("  Admin:  admin@virtumall.com / password123");
  console.log("  Seller: carlos@tiendadigital.bo / password123");
  console.log("  Seller: maria@giftzone.com / password123");
  console.log("  Buyer:  buyer@test.com / password123");
  console.log(`\nProducts: ${productsData.length}`);
  console.log("Categories: 5 | Brands: 14 | Regions: 9");
  console.log("========================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
