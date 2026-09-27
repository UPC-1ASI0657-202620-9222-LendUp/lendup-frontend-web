'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, StatusBadge } from '@/components/lendup/shared';
import { verificationService } from '@/services/domain-services';
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
            Podrás revisar y aceptar los{' '}
            <Link to="/terms">términos de LendUp</Link> después de verificar tu
            correo.
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { state, verifyCurrentUser, setVerificationStatus } = useDemo();
  const [message, setMessage] = useState('');
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
        {message && (
          <output
            className={
              user?.verificationStatus === 'ERROR'
                ? 'field-error'
                : 'success-text'
            }
          >
            {message}
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
        <Button
          type="button"
          variant="ghost"
          disabled={user?.verificationStatus === 'SENDING'}
          onClick={async () => {
            setVerificationStatus('SENDING');
            setMessage('');
            try {
              const result = await verificationService.resend();
              setVerificationStatus(result.status);
              setMessage('Correo reenviado correctamente.');
            } catch {
              setVerificationStatus('ERROR');
              setMessage('No se pudo reenviar el correo. Intenta nuevamente.');
            }
          }}
        >
          {user?.verificationStatus === 'SENDING'
            ? 'Reenviando…'
            : 'Reenviar correo'}
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
          disabled={!accepted || !state.authenticated}
          onClick={() => {
            if (acceptTerms()) navigate('/app');
          }}
        >
          {state.authenticated
            ? 'Aceptar y continuar'
            : 'Inicia sesión para aceptar'}
        </Button>
        {!state.authenticated && (
          <p className="muted">
            Puedes leer los términos públicamente, pero su aceptación requiere
            una sesión iniciada.
          </p>
        )}
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
