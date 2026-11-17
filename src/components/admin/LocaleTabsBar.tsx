"use client";

export type AdminEditLocale = 'en' | 'my' | 'zh';

interface LocaleTabsBarProps {
  activeLocale: AdminEditLocale;
  onChange: (locale: AdminEditLocale) => void;
  hasTranslation?: (locale: 'my' | 'zh') => boolean;
}

const TABS: { key: AdminEditLocale; label: string; flag: string }[] = [
  { key: 'en', label: 'English (Primary)', flag: '🇺🇸' },
  { key: 'my', label: 'Bahasa Melayu (my)', flag: '🇲🇾' },
  { key: 'zh', label: '中文 (zh)', flag: '🇨🇳' },
];

export function LocaleTabsBar({ activeLocale, onChange, hasTranslation }: LocaleTabsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-2">
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Content language">
        {TABS.map((tab) => {
          const active = activeLocale === tab.key;
          const translated = tab.key !== 'en' && hasTranslation ? hasTranslation(tab.key) : true;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-300'
                  : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'
              }`}
            >
              <span>{tab.flag}</span>
              <span>{tab.label}</span>
              {tab.key !== 'en' && (
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    translated ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                  title={translated ? 'Has translation' : 'Fallback to English'}
                />
              )}
            </button>
          );
        })}
      </div>
      {activeLocale !== 'en' && (
        <span className="text-xs text-stone-500 px-2">
          Blank fields fall back to English on the storefront.
        </span>
      )}
    </div>
  );
}
