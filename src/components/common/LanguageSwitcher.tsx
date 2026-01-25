'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';

export default function LanguageSwitcher() {
    const router = useRouter();
    const localActive = useLocale();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    const onSelectChange = (nextLocale: string) => {
        setIsOpen(false);
        if (nextLocale === localActive) return;

        startTransition(() => {
            // 设置 Cookie
            document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`; // 1 year
            router.refresh();
        });
    };

    return (
        <div className="relative">
            <button
                className="btn btn-ghost btn-sm flex items-center gap-1"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
            >
                <span className="text-lg">
                    {localActive === 'en' ? '🇺🇸' : '🇨🇳'}
                </span>
                <span className="text-xs font-medium uppercase">{localActive}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${localActive === 'zh-CN' ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-200'}`}
                        onClick={() => onSelectChange('zh-CN')}
                    >
                        🇨🇳 中文
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${localActive === 'en' ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-200'}`}
                        onClick={() => onSelectChange('en')}
                    >
                        🇺🇸 English
                    </button>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </div>
    );
}
