import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Loader2, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { cn } from '@/utils/cn';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockCreds = authService.getMockCredentials();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#020617]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 bg-slate-900 dark:bg-slate-950 relative overflow-hidden p-12">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-sky-600/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/40">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">INTELLIMED</h1>
              <p className="text-xs text-slate-500">Smart medication. Safer routines.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Medication monitoring<br />you can trust.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            INTELLIMED connects patients, caregivers, and IoT devices for seamless medication management and real-time adherence monitoring.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: '📋', text: 'Smart medication scheduling' },
              { icon: '📊', text: 'Real-time adherence analytics' },
              { icon: '🔔', text: 'Automated dose reminders' },
              { icon: '📡', text: 'IoT device monitoring' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="text-base">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-auto grid grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Patients' },
            { value: '94%', label: 'Avg. Adherence' },
            { value: '3', label: 'Devices Online' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">INTELLIMED</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your INTELLIMED account</p>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-sm animate-slide-up">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label block mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn('input', errors.email && 'input-error')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label">Password</label>
                <a href="#" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn('input pr-10', errors.password && 'input-error')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full h-10 text-sm font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3 font-medium uppercase tracking-wider">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {mockCreds.map(c => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => fillDemoCredentials(c.email, c.password)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-400 text-xs font-bold">
                      {c.role.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.role}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
