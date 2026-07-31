import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Scissors } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Redirect, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAdminAuth } from '../hooks/useAdminAuth';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail valido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});

type LoginData = z.infer<typeof loginSchema>;

export function AdminLoginPage() {
  const { session, signIn, resetPassword } = useAdminAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation<{ from?: Location }>();
  const from = location.state?.from?.pathname || '/admin';
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  if (session) return <Redirect to={from} />;

  async function submit(data: LoginData) {
    try {
      setIsSubmitting(true);
      setMessage(null);
      await signIn(data.email, data.password);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function recover() {
    try {
      await resetPassword(watch('email'));
      setMessage('Enviamos as instrucoes de recuperacao para o e-mail informado.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-brand login-brand">
          <Scissors size={24} />
          <span>Barbearia Elite</span>
        </div>
        <h1>Acesso administrativo</h1>
        <p>Entre com o usuario administrador. Nao ha cadastro publico.</p>
        <form onSubmit={handleSubmit(submit)} className="admin-form">
          <label>
            E-mail
            <input type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span>{errors.email.message}</span> : null}
          </label>
          <label>
            Senha
            <div className="admin-password-field">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} />
              <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password ? <span>{errors.password.message}</span> : null}
          </label>
          {message ? <p className="admin-alert" role="status">{message}</p> : null}
          <button className="admin-button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
          <button className="admin-link-button" type="button" onClick={() => void recover()}>
            Recuperar senha
          </button>
        </form>
      </section>
    </main>
  );
}
