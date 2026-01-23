import Carousel from "@/components/features/Carousel";
import MasonryGrid from "@/components/features/MasonryGrid";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import styles from "./page.module.css";

// 启用 ISR，每 60 秒重新验证
export const revalidate = 60;

// 优化后的数据获取函数 - 合并查询
async function getHomePageData() {
  try {
    // 并行获取所有基础数据
    const [albums, featured, settings] = await Promise.all([
      // 获取轮播图
      prisma.album.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          cover: true,
          link: true,
        },
      }),
      // 获取精选作品 ID
      prisma.featuredPortfolio.findMany({
        orderBy: { order: "asc" },
        select: { portfolioId: true },
      }),
      // 获取系统设置
      prisma.systemSettings.findFirst({
        select: {
          featuredViewMode: true,
          featuredColumns: true,
          featuredMaxRows: true,
        },
      }),
    ]);

    const featuredIds = featured.map((f) => f.portfolioId);

    // 一次性获取所有需要的作品集（精选 + 非精选）
    const allPortfolios = await prisma.portfolio.findMany({
      where: {
        status: "APPROVED",
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30, // 多获取一些以防精选的不够
    });

    // 分离精选和非精选
    const featuredPortfolios: typeof allPortfolios = [];
    const otherPortfolios: typeof allPortfolios = [];

    for (const portfolio of allPortfolios) {
      if (featuredIds.includes(portfolio.id)) {
        featuredPortfolios.push(portfolio);
      } else {
        otherPortfolios.push(portfolio);
      }
    }

    // 按精选顺序排序
    const sortedFeatured = featuredIds
      .map((id) => featuredPortfolios.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // 合并：精选优先，然后是其他作品，最多 20 个
    const remainingCount = Math.max(0, 20 - sortedFeatured.length);
    const finalPortfolios = [
      ...sortedFeatured,
      ...otherPortfolios.slice(0, remainingCount),
    ].map((p) => ({
      ...p,
      itemCount: p._count.items,
    }));

    return {
      albums,
      portfolios: finalPortfolios,
      settings: settings || {
        featuredViewMode: "masonry",
        featuredColumns: 4,
        featuredMaxRows: 2,
      },
    };
  } catch (error) {
    console.error("Fetch home page data error:", error);
    return {
      albums: [],
      portfolios: [],
      settings: {
        featuredViewMode: "masonry",
        featuredColumns: 4,
        featuredMaxRows: 2,
      },
    };
  }
}

export default async function HomePage() {
  const [homeData, currentUser] = await Promise.all([
    getHomePageData(),
    getAuthUser(),
  ]);

  const { albums, portfolios, settings } = homeData;

  return (
    <div className={styles.page}>
      {/* Hero Carousel */}
      <section className={styles.hero}>
        <Carousel albums={albums} autoPlayInterval={6000} />
      </section>

      {/* Featured Works */}
      <section className={styles.featured}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2 className="heading-2">精选作品</h2>
              <p className={styles.sectionSubtitle}>探索夏令营学员的创意世界</p>
            </div>
            <a href="/explore" className="btn btn-secondary">
              查看更多
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <MasonryGrid
            portfolios={portfolios}
            initialViewMode={settings.featuredViewMode as "masonry" | "grid"}
            initialColumns={settings.featuredColumns}
            maxRows={settings.featuredMaxRows}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              {currentUser ? (
                <>
                  <h2 className="heading-2">继续你的创作</h2>
                  <p>欢迎回来，{currentUser.name}！进入个人中心管理你的作品集，或探索更多精彩创作。</p>
                  <div className={styles.ctaButtons}>
                    <a href="/dashboard" className="btn btn-primary btn-lg">
                      个人中心
                    </a>
                    <a href="/explore" className="btn btn-secondary btn-lg">
                      探索更多作品
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="heading-2">展示你的作品</h2>
                  <p>加入我们，分享你在夏令营中的精彩创作，与更多人分享你的才华与创意。</p>
                  <div className={styles.ctaButtons}>
                    <a href="/register" className="btn btn-primary btn-lg">
                      立即注册
                    </a>
                    <a href="/login" className="btn btn-secondary btn-lg">
                      已有账号？登录
                    </a>
                  </div>
                </>
              )}
            </div>
            <div className={styles.ctaDecor}>
              <div className={styles.decorCircle}></div>
              <div className={styles.decorCircle}></div>
              <div className={styles.decorCircle}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span>Art Share</span>
            </div>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Art Share. 夏令营作品展示平台
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
