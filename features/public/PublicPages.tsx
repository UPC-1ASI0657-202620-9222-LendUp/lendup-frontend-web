'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/lendup/Brand';
import { LanguageSwitcher } from '@/components/lendup/LanguageSwitcher';
import { Field } from '@/components/lendup/forms';
import { Feedback, PageHeader } from '@/components/lendup/shared';
import { TermsAcceptance, TermsDocument } from '@/components/lendup/terms';
import { supportedLocales } from '@/config/app-config';
import { translate, useI18n, type MessageKey } from '@/lib/i18n';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { authService } from '@/services/auth/auth.service';
import { isInstitutionalEmail } from '@/lib/business-rules';
import { catalogService, findUniversity } from '@/services/catalog.service';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';
import { currentUserOf, termsAcceptedBy } from '@/stores/selectors';

function StableLabel({ messageKey }: { messageKey: MessageKey }) {
  const { locale } = useI18n();
  return (
    <span className="stable-label">
      {supportedLocales.map((code) => (
        <span key={code} data-active={code === locale}>
          {translate(code, messageKey)}
        </span>
      ))}
    </span>
  );
}

export function PublicHeader() {
  const { t } = useI18n();
  const { state } = useLendUp();
  return (
    <header className="public-header">
      <Brand to="/" label={t('nav.brandHome')} />
      <nav aria-label={t('nav.public')}>
        <LanguageSwitcher />
        {state.authenticated ? (
          <Button render={<Link to="/app" />}>
            <StableLabel messageKey="nav.goToApp" />
          </Button>
        ) : (
          <>
            <Link className="text-link" to="/login">
              <StableLabel messageKey="auth.login.submit" />
            </Link>
            <Button render={<Link to="/register" />}>
              <StableLabel messageKey="auth.register.cta" />
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}

function AuthFrame({
  title,
  description,
  children,
  wide = false,
  aside,
}: {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
  aside?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="auth-page">
      <PublicHeader />
      <main id="main-content" className="auth-main">
        <section className="auth-hero">
          {aside ?? (
            <>
              <p className="eyebrow">{t('meta.tagline')}</p>
              <h2>{t('auth.hero.title')}</h2>
              <ul>
                <li>
                  <CheckCircle2 aria-hidden="true" />
                  {t('auth.hero.point1')}
                </li>
                <li>
                  <CheckCircle2 aria-hidden="true" />
                  {t('auth.hero.point2')}
                </li>
                <li>
                  <CheckCircle2 aria-hidden="true" />
                  {t('auth.hero.point3')}
                </li>
              </ul>
            </>
          )}
        </section>
        <div className={`auth-card ${wide ? 'wide' : ''}`}>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useLendUp();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t('validation.email')),
        password: z.string().min(1, t('validation.required')),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const [result, setResult] = useState<ActionResult | null>(null);

  const submit = async (values: Values) => {
    const outcome = await login(values.email, values.password);
    setResult(outcome.ok ? null : outcome);
  };

  return (
    <AuthFrame
      title={t('auth.login.title')}
      description={t('auth.login.description')}
    >
      <form onSubmit={handleSubmit(submit)} className="auth-form" noValidate>
        <Field
          label={t('fields.institutionalEmail')}
          error={errors.email?.message}
          required
        >
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />
        </Field>
        <Field
          label={t('fields.password')}
          error={errors.password?.message}
          required
        >
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>
        <Feedback result={result} />
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
        <p className="auth-switch">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register">{t('auth.register.cta')}</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { t } = useI18n();
  const { registerUser, firebaseUser, profileMissing, logout } = useLendUp();
  const completingProfile = Boolean(firebaseUser);
  const [result, setResult] = useState<ActionResult | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(5, t('validation.fullName')),
          universityId: z.string().min(1, t('validation.select')),
          campus: z.string().min(1, t('validation.select')),
          career: z
            .string()
            .trim()
            .min(3, t('validation.min', { count: 3 })),
          cycle: z.coerce
            .number()
            .int(t('validation.cycle'))
            .min(1, t('validation.cycle'))
            .max(14, t('validation.cycle')),
          email: z.string().trim().toLowerCase().email(t('validation.email')),
          phone: z
            .string()
            .trim()
            .regex(/^\+?\d[\d\s]{8,14}$/, t('validation.phone')),
          password: z
            .string()
            .min(completingProfile ? 0 : 8, t('validation.passwordLength'))
            .refine(
              (value) => completingProfile || /[A-Za-z]/.test(value),
              t('validation.passwordLetter'),
            )
            .refine(
              (value) => completingProfile || /\d/.test(value),
              t('validation.passwordNumber'),
            ),
          confirm: z.string(),
        })
        .refine(
          (value) => completingProfile || value.password === value.confirm,
          {
            path: ['confirm'],
            message: t('validation.passwordMatch'),
          },
        )
        .refine(
          (value) =>
            isInstitutionalEmail(
              value.email,
              findUniversity(value.universityId),
            ),
          {
            path: ['email'],
            message: t('validation.institutionalEmail'),
          },
        ),
    [t, completingProfile],
  );
  type Values = z.input<typeof schema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      universityId: '',
      campus: '',
      cycle: '',
      password: '',
      confirm: '',
      email: firebaseUser?.email ?? '',
    },
  });
  useEffect(() => {
    if (firebaseUser?.email) setValue('email', firebaseUser.email);
  }, [firebaseUser?.email, setValue]);
  const universityId = watch('universityId');
  const university = findUniversity(universityId);

  return (
    <AuthFrame
      wide
      title={t(
        completingProfile
          ? 'auth.register.completeTitle'
          : 'auth.register.title',
      )}
      description={t(
        completingProfile
          ? 'auth.register.completeDescription'
          : 'auth.register.description',
      )}
    >
      {profileMissing && <output>{t('auth.register.recoveryNotice')}</output>}
      <form
        noValidate
        className="auth-form form-grid"
        onSubmit={handleSubmit(async (raw) => {
          const values = schema.parse(raw);
          const outcome = await registerUser({
            name: values.name,
            email: values.email,
            phone: values.phone,
            universityId: values.universityId,
            campus: values.campus,
            career: values.career,
            cycle: String(values.cycle),
            password: values.password,
          });
          setResult(outcome);
        })}
      >
        <Field
          label={t('fields.fullName')}
          error={errors.name?.message}
          required
          wide
        >
          <input autoComplete="name" {...register('name')} />
        </Field>
        <Field
          label={t('fields.university')}
          error={errors.universityId?.message}
          required
        >
          <select
            {...register('universityId', {
              onChange: () => setValue('campus', ''),
            })}
          >
            <option value="">{t('common.selectOption')}</option>
            {catalogService.universities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.shortName} — {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={t('fields.campus')}
          error={errors.campus?.message}
          required
        >
          <select {...register('campus')} disabled={!university}>
            <option value="">{t('common.selectOption')}</option>
            {university?.campuses.map((campus) => (
              <option key={campus.id} value={campus.name}>
                {campus.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={t('fields.career')}
          error={errors.career?.message}
          required
        >
          <input {...register('career')} />
        </Field>
        <Field label={t('fields.cycle')} error={errors.cycle?.message} required>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            {...register('cycle')}
          />
        </Field>
        <Field
          label={t('fields.institutionalEmail')}
          error={errors.email?.message}
          hint={
            university
              ? t('auth.register.domainHint', {
                  domains: university.emailDomains
                    .map((d) => `@${d}`)
                    .join(', '),
                })
              : undefined
          }
          required
        >
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            readOnly={completingProfile}
            {...register('email')}
          />
        </Field>
        <Field
          label={t('fields.phone')}
          error={errors.phone?.message}
          hint={t('auth.register.phoneHint')}
          required
        >
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            {...register('phone')}
          />
        </Field>
        {!completingProfile && (
          <>
            <Field
              label={t('fields.password')}
              error={errors.password?.message}
              hint={t('auth.register.passwordHint')}
              required
            >
              <input
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
            </Field>
            <Field
              label={t('fields.confirmPassword')}
              error={errors.confirm?.message}
              required
            >
              <input
                type="password"
                autoComplete="new-password"
                {...register('confirm')}
              />
            </Field>
          </>
        )}
        <div className="full-span">
          <Feedback result={result && !result.ok ? result : null} />
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting
              ? t('auth.register.submitting')
              : t(
                  completingProfile
                    ? 'auth.register.completeSubmit'
                    : 'auth.register.submit',
                )}
          </Button>
          <p className="auth-switch">
            {t('auth.register.termsNotice')}{' '}
            <Link to="/terms">{t('auth.register.termsLink')}</Link>
          </p>
          {completingProfile && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void logout()}
            >
              {t('auth.register.changeAccount')}
            </Button>
          )}
          <p className="auth-switch">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login">{t('auth.login.submit')}</Link>
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}

export function VerifyEmailPage() {
  const { t } = useI18n();
  const { user, ready, emailVerified } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (emailVerified) return <Navigate to="/app" replace />;
  const run = async (check: boolean) => {
    setBusy(true);
    try {
      if (check) {
        if (await authService.refreshVerification()) {
          await queryClient.invalidateQueries({ queryKey: ['me'] });
          navigate('/app', { replace: true });
        } else setResult({ ok: false, message: 'auth.verify.linkPending' });
      } else {
        await authService.sendVerification();
        setResult({ ok: true, message: 'auth.verify.linkSent' });
      }
    } catch {
      setResult({ ok: false, message: 'auth.verify.linkError' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame
      title={t('auth.verify.linkTitle')}
      description={t('auth.verify.linkDescription', {
        email: user.email ?? '',
      })}
    >
      <p>{t('auth.verify.linkInstructions')}</p>
      <Feedback result={result} />
      <div className="button-row">
        <Button disabled={busy} onClick={() => void run(true)}>
          {t('auth.verify.linkCheck')}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void run(false)}
        >
          {t('auth.verify.resend')}
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => void authService.logout()}
        >
          {t('auth.register.changeAccount')}
        </Button>
      </div>
    </AuthFrame>
  );
}

export function TermsPage() {
  const { t } = useI18n();
  const { state } = useLendUp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/app';
  const user = currentUserOf(state);
  const accepted = user ? termsAcceptedBy(state, user.id) : false;
  return (
    <div className="terms-page">
      <PublicHeader />
      <main id="main-content" className="terms-main">
        <PageHeader
          eyebrow={t('terms.eyebrow')}
          title={t('terms.title')}
          description={t('terms.description')}
        />
        <TermsDocument />
        <section className="panel terms-action">
          {!state.authenticated ? (
            <>
              <p className="muted">{t('terms.loginToAccept')}</p>
              <Button render={<Link to="/login" />}>
                {t('auth.login.submit')}
              </Button>
            </>
          ) : user?.role === 'ADMIN' ? (
            <p className="muted">{t('terms.adminNotice')}</p>
          ) : accepted ? (
            <>
              <p className="success-text">
                <CheckCircle2 aria-hidden="true" />
                {t('terms.alreadyAccepted')}
              </p>
              <Button render={<Link to={next} />}>
                {t('common.continue')}
              </Button>
            </>
          ) : (
            <TermsAcceptance onAccepted={() => navigate(next)} />
          )}
        </section>
      </main>
    </div>
  );
}
