import Carousel from "@/components/features/Carousel";
import MasonryGrid from "@/components/features/MasonryGrid";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function getAlbums() {
  try {
    const albums = await prisma.album.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return albums;
  } catch (error) {
    console.error("Fetch albums error:", error);
    return [];
  }
}

async function getPortfolios() {
  try {
    const portfolios = await prisma.portfolio.findMany({
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
      take: 20,
    });

    return portfolios.map((p) => ({
      ...p,
      itemCount: p._count.items,
    }));
  } catch (error) {
    console.error("Fetch portfolios error:", error);
    return [];
  }
}

async function getSystemSettings() {
  try {
    const settings = await prisma.systemSettings.findFirst();
    return settings || {
      featuredViewMode: "masonry",
      featuredColumns: 4,
      featuredMaxRows: 2,
    };
  } catch (error) {
    console.error("Fetch settings error:", error);
    return {
      featuredViewMode: "masonry",
      featuredColumns: 4,
      featuredMaxRows: 2,
    };
  }
}

export default async function HomePage() {
  const [albums, portfolios, settings, currentUser] = await Promise.all([
    getAlbums(),
    getPortfolios(),
    getSystemSettings(),
    getAuthUser(),
  ]);

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
