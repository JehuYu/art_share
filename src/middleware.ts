import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

// next-intl 中间件（用于语言检测）
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'never', // 不在 URL 中显示语言前缀
});

export function middleware(request: NextRequest) {
    // 对于 API 路由，跳过国际化处理
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // 对于静态资源，跳过处理
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/uploads') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!_next|uploads|api|.*\\..*).*)'],
};
