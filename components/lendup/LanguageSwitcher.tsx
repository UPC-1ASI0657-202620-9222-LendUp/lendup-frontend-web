import { useState, type CSSProperties } from 'react';
import { Languages } from 'lucide-react';
import { supportedLocales } from '@/config/app-config';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  tone = 'default',
}: {
  tone?: 'default' | 'dark';
}) {
  const { locale, setLocale, t } = useI18n();
  const [animated, setAnimated] = useState(false);
  const activeIndex = Math.max(supportedLocales.indexOf(locale), 0);
  return (
    <fieldset className={cn('language-switcher', tone === 'dark' && 'on-dark')}>
      <legend className="sr-only">{t('common.language')}</legend>
      <Languages aria-hidden="true" />
      <span
        className={cn('language-switcher-options', animated && 'is-animated')}
        style={{ '--active-index': activeIndex } as CSSProperties}
      >
        <span className="language-switcher-thumb" aria-hidden="true" />
        {supportedLocales.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={locale === code}
            aria-label={t(`common.locales.${code}`)}
            onClick={() => {
              setAnimated(true);
              setLocale(code);
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </span>
    </fieldset>
  );
}
