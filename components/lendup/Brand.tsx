import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({
  className,
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <img
      className={cn('logo-mark', className)}
      src={
        tone === 'light'
          ? '/brand/logo-mark-on-dark.webp'
          : '/brand/logo-mark-on-light.webp'
      }
      width={320}
      height={228}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

export function LogoStacked({ className }: { className?: string }) {
  return (
    <img
      className={cn('logo-stacked', className)}
      src="/brand/logo-stacked-on-light.webp"
      width={480}
      height={491}
      alt="LendUp"
      draggable={false}
    />
  );
}

export function Brand({
  to = '/',
  tone = 'dark',
  label,
}: {
  to?: string;
  tone?: 'dark' | 'light';
  label: string;
}) {
  return (
    <Link
      to={to}
      className={cn('brand', tone === 'light' && 'brand-light')}
      aria-label={label}
    >
      <LogoMark tone={tone} />
      <span className="brand-word">
        Lend<span>Up</span>
      </span>
    </Link>
  );
}
