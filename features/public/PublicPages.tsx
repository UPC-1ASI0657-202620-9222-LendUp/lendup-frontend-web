'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ListingCard,
  PageHeader,
  StatusBadge,
} from '@/components/lendup/shared';
import { useDemo } from '@/stores/demo-store';

export function PublicHeader() {
  return (
    <header className="public-header">
      <Link to="/" className="brand">
        <span className="brand-mark">
          <ShieldCheck />
        </span>
        <span>LendUp</span>
      </Link>
      <nav aria-label="Navegación pública">
        <Link to="/explore">Explorar</Link>
        <Link to="/login">Iniciar sesión</Link>
        <Button render={<Link to="/register" />}>Crear cuenta</Button>
      </nav>
    </header>
  );
}

export function LandingPage() {
  const { state } = useDemo();
  const featured = state.listings
    .filter((item) => item.status === 'ACTIVE')
    .slice(0, 3);
  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <Sparkles />
              Comunidad universitaria verificada
            </span>
            <h1>Lo que necesitas puede estar a unos pasos.</h1>
            <p>
              Presta lo que no usas. Consigue lo que necesitas, con condiciones
              claras, evidencia y respaldo.
            </p>
            <div className="hero-actions">
              <Button size="lg" render={<Link to="/login" />}>
                Explorar objetos <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link to="/register" />}
              >
                Crear cuenta
              </Button>
            </div>
            <div className="hero-trust">
              <span>
                <CheckCircle2 />
                Perfiles verificados
              </span>
              <span>
                <ShieldCheck />
                Garantías claras
              </span>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top">
              <span className="eyebrow">Disponible cerca de ti</span>
              <span className="live-dot">Ahora</span>
            </div>
            <img
              src={featured[0]?.image}
              alt={featured[0]?.title ?? 'Objeto disponible'}
            />
            <div className="hero-card-body">
              <div>
                <h3>{featured[0]?.title}</h3>
                <p>
                  {featured[0]?.university} · {featured[0]?.campus}
                </p>
              </div>
              <strong>
                S/ {featured[0]?.dailyRate} <small>/ día</small>
              </strong>
            </div>
          </div>
        </section>
        <section className="how">
          <span className="eyebrow">Simple de principio a fin</span>
          <h2>Una forma más segura de compartir</h2>
          <div className="steps">
            <article>
              <span>01</span>
              <Search />
              <h3>Encuentra o publica</h3>
              <p>
                Explora objetos de estudiantes verificados o publica lo que ya
                no usas a diario.
              </p>
            </article>
            <article>
              <span>02</span>
              <FileCheck2 />
              <h3>Reserva con claridad</h3>
              <p>
                Fechas, tarifa, garantía y condiciones quedan confirmadas antes
                de la entrega.
              </p>
            </article>
            <article>
              <span>03</span>
              <ShieldCheck />
              <h3>Entrega con respaldo</h3>
              <p>
                Registra evidencias, confirma la recepción y devuelve con
                trazabilidad completa.
              </p>
            </article>
          </div>
        </section>
        <section className="featured">
          <PageHeader
            eyebrow="Explora la comunidad"
            title="Objetos destacados"
            action={
              <Button variant="outline" render={<Link to="/login" />}>
                Ver todos <ArrowRight />
              </Button>
            }
          />
          <div className="listing-grid">
            {featured.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                owner={state.users.find((user) => user.id === item.ownerId)}
              />
            ))}
          </div>
        </section>
        <section className="benefits">
          <article>
            <UsersRound />
            <h3>Tu comunidad</h3>
            <p>Perfiles vinculados a universidades y campus reales.</p>
          </article>
          <article>
            <BadgeCheck />
            <h3>Reputación útil</h3>
            <p>Valoraciones ligadas a préstamos completados.</p>
          </article>
          <article>
            <ShieldCheck />
            <h3>Más respaldo</h3>
            <p>Evidencias y garantías separadas de la tarifa.</p>
          </article>
        </section>
      </main>
      <footer className="public-footer">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck />
          </span>
          LendUp
        </div>
        <p>Hecho para compartir mejor dentro de tu comunidad universitaria.</p>
        <Link to="/terms">Términos y condiciones</Link>
      </footer>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type LoginValues = z.infer<typeof loginSchema>;
export function LoginPage() {
  const { login } = useDemo();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alexandra.ruiz@pucp.edu.pe',
      password: 'lendup123',
    },
  });
  const submit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      navigate('/app');
    } catch (error) {
      const code =
        error instanceof Error ? error.message : 'INVALID_CREDENTIALS';
      setError('password', {
        message:
          code === 'USER_NOT_FOUND'
            ? 'No existe una cuenta con ese correo.'
            : code === 'ACCOUNT_SUSPENDED'
              ? 'Esta cuenta está suspendida.'
              : 'Correo o contraseña incorrectos.',
      });
    }
  };
  return (
    <AuthFrame
      title="Bienvenida de nuevo"
      description="Continúa con tus reservas, préstamos y objetos."
    >
      <form onSubmit={handleSubmit(submit)} className="auth-form">
        <Field label="Correo institucional" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>
        <div className="form-row">
          <label className="check-row">
            <input type="checkbox" />
            Recordarme
          </label>
          <span className="muted">Demo: usa lendup123</span>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
        <p className="auth-switch">
          ¿Aún no tienes cuenta? <Link to="/register">Crear una cuenta</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

const registerSchema = z
  .object({
    names: z.string().min(3, 'Ingresa tus nombres'),
    university: z.string().min(2),
    campus: z.string().min(2),
    career: z.string().min(2),
    cycle: z.string().min(1),
    email: z.string().email('Ingresa un correo válido'),
    phone: z.string().regex(/^\+?[0-9 ]{9,15}$/, 'Ingresa un teléfono válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });
type RegisterValues = z.infer<typeof registerSchema>;
export function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser } = useDemo();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { university: 'PUCP', campus: 'San Miguel', cycle: '6' },
  });
  return (
    <AuthFrame
      wide
      title="Crea tu cuenta universitaria"
      description="Usaremos tu correo institucional para verificar tu comunidad."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          registerUser({
            name: values.names,
            email: values.email,
            phone: values.phone,
            university: values.university,
            campus: values.campus,
            career: values.career,
            cycle: values.cycle,
            password: values.password,
          });
          navigate('/verify-email');
        })}
        className="auth-form form-grid"
      >
        <Field label="Nombres" error={errors.names?.message}>
          <input {...register('names')} placeholder="Nombres y apellidos" />
        </Field>
        <Field label="Universidad">
          <select {...register('university')}>
            <option>UPC</option>
            <option>PUCP</option>
            <option>UNI</option>
            <option>UNMSM</option>
          </select>
        </Field>
        <Field label="Campus" error={errors.campus?.message}>
          <input {...register('campus')} />
        </Field>
        <Field label="Carrera" error={errors.career?.message}>
          <input {...register('career')} />
        </Field>
        <Field label="Ciclo" error={errors.cycle?.message}>
          <input {...register('cycle')} />
        </Field>
        <Field label="Correo institucional" error={errors.email?.message}>
          <input type="email" {...register('email')} />
        </Field>
        <Field label="Teléfono" error={errors.phone?.message}>
          <input type="tel" {...register('phone')} />
        </Field>
        <span />
        <Field label="Contraseña" error={errors.password?.message}>
          <input type="password" {...register('password')} />
        </Field>
        <Field label="Confirmar contraseña" error={errors.confirm?.message}>
          <input type="password" {...register('confirm')} />
        </Field>
        <div className="full-span">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
          <p className="auth-switch">
            Al continuar aceptas los <Link to="/terms">términos de LendUp</Link>
            .
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { state, verifyCurrentUser } = useDemo();
  const [resent, setResent] = useState(false);
  const user = state.users.find(
    (candidate) => candidate.id === state.currentUserId,
  );
  return (
    <AuthFrame
      title="Verifica tu correo"
      description={`Enviamos un enlace a ${user?.email ?? 'tu correo institucional'}`}
    >
      <div className="verification-card">
        <span className="verification-icon">
          <FileCheck2 />
        </span>
        <h3>Verificación pendiente</h3>
        <StatusBadge status={user?.verificationStatus ?? 'PENDING'} />
        <p>
          Abre el enlace desde tu correo institucional. Puede tardar un par de
          minutos.
        </p>
        {resent && (
          <output className="success-text">
            Correo reenviado correctamente.
          </output>
        )}
        <Button
          onClick={() => {
            verifyCurrentUser();
            navigate('/terms');
          }}
        >
          Simular verificación completada
        </Button>
        <Button type="button" variant="ghost" onClick={() => setResent(true)}>
          Reenviar correo
        </Button>
      </div>
    </AuthFrame>
  );
}

export function TermsPage() {
  const { state, acceptTerms } = useDemo();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="terms-page">
      <PublicHeader />
      <main>
        <PageHeader
          eyebrow="Versión 1.0 · septiembre 2026"
          title="Términos y condiciones"
          description="Reglas esenciales para prestar y solicitar objetos dentro de LendUp."
        />
        <article className="terms-document">
          <h2>1. Uso responsable</h2>
          <p>
            LendUp facilita acuerdos temporales entre estudiantes. Cada persona
            debe revisar el objeto, las condiciones y las fechas.
          </p>
          <h2>2. Tarifas y garantías</h2>
          <p>
            La tarifa y la garantía son conceptos separados. La garantía puede
            permanecer retenida mientras una incidencia esté en revisión.
          </p>
          <h2>3. Evidencias e incidencias</h2>
          <p>
            Las evidencias apoyan la revisión de una operación. El análisis
            automático es informativo y no determina responsabilidades.
          </p>
          <div className="legal-note">
            <ShieldCheck />
            <p>
              <strong>Descargo de responsabilidad</strong>LendUp no sustituye la
              revisión personal del estado de los objetos.
            </p>
          </div>
        </article>
        <label className="accept-terms">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          He leído y acepto los términos y condiciones de LendUp.
        </label>
        <Button
          size="lg"
          disabled={!accepted}
          onClick={() => {
            acceptTerms();
            navigate(state.authenticated ? '/app' : '/login');
          }}
        >
          Aceptar y continuar
        </Button>
      </main>
    </div>
  );
}

function AuthFrame({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="auth-page">
      <PublicHeader />
      <main>
        <div className={`auth-card ${wide ? 'wide' : ''}`}>
          <span className="auth-icon">
            <ShieldCheck />
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
