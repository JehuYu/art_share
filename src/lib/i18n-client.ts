'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * 客户端翻译 Hook
 * 包装 next-intl 的 useTranslations，提供更好的类型支持
 */
export function useTranslations(namespace?: string) {
    return useNextIntlTranslations(namespace);
}

/**
 * 获取翻译函数（用于需要动态 namespace 的场景）
 */
export function useT() {
    const t = useNextIntlTranslations();
    return t;
}

/**
 * 格式化带变量的翻译文本
 */
export function formatMessage(
    t: ReturnType<typeof useNextIntlTranslations>,
    key: string,
    values?: Record<string, string | number>
): string {
    try {
        return t(key, values);
    } catch {
        return key;
    }
}
