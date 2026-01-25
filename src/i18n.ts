import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// 支持的语言列表
export const locales = ['zh-CN', 'en'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh-CN';

// 语言显示名称
export const localeNames: Record<Locale, string> = {
    'zh-CN': '简体中文',
    'en': 'English',
};

/**
 * 获取当前语言设置
 * 优先级：Cookie > Accept-Language Header > 默认值
 */
async function getLocale(): Promise<Locale> {
    // 1. 尝试从 Cookie 获取
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale')?.value;
    if (localeCookie && locales.includes(localeCookie as Locale)) {
        return localeCookie as Locale;
    }

    // 2. 尝试从 Accept-Language Header 获取
    const headersList = await headers();
    const acceptLanguage = headersList.get('Accept-Language');
    if (acceptLanguage) {
        // 解析 Accept-Language，例如 "zh-CN,zh;q=0.9,en;q=0.8"
        const languages = acceptLanguage.split(',').map(lang => {
            const [code] = lang.trim().split(';');
            return code;
        });

        for (const lang of languages) {
            // 精确匹配
            if (locales.includes(lang as Locale)) {
                return lang as Locale;
            }
            // 前缀匹配（如 "zh" 匹配 "zh-CN"）
            const prefix = lang.split('-')[0];
            const matched = locales.find(l => l.startsWith(prefix));
            if (matched) {
                return matched;
            }
        }
    }

    // 3. 返回默认语言
    return defaultLocale;
}

export default getRequestConfig(async () => {
    const locale = await getLocale();

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
