import Link from 'next/link';
import { Music2, Zap, Users, Clock } from 'lucide-react';
import { SpotifyConnectButton } from '@/components/SpotifyConnectButton';

interface SearchParamsProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function HomePage({ searchParams }: SearchParamsProps) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, string> = {
    spotify_denied: 'Cancelaste la conexión con Spotify.',
    invalid_state: 'Error de seguridad. Intentá de nuevo.',
    token_exchange_failed: 'No se pudo conectar con Spotify. Intentá de nuevo.',
  };

  const features = [
    {
      icon: Zap,
      title: 'En tiempo real',
      desc: 'Ves lo que escucha al instante, con latencia de segundos.',
    },
    {
      icon: Users,
      title: 'Solo para dos',
      desc: 'Una sala privada, máximo 2 personas. Simple y íntimo.',
    },
    {
      icon: Clock,
      title: 'Historial del día',
      desc: 'Timeline unificado de lo que escucharon juntos hoy.',
    },
  ];

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-900/40">
            <Music2 size={24} className="text-white" />
          </div>
          <h1 className="font-righteous text-4xl sm:text-5xl text-white tracking-tight">
            DuoVibe
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl text-zinc-300 font-light leading-relaxed mb-2">
          Música compartida{' '}
          <span className="text-rose-400 font-medium">en tiempo real</span>
        </p>
        <p className="text-zinc-500 text-sm mb-10 max-w-sm">
          Conectá tu Spotify, invitá a alguien especial y escuchen juntos — sin importar la distancia.
        </p>

        {/* Error banner */}
        {error && (
          <div className="w-full mb-6 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 text-sm">
            {errorMessages[error] ?? 'Ocurrió un error. Intentá de nuevo.'}
          </div>
        )}

        {/* CTA */}
        <SpotifyConnectButton size="lg" label="Empezar con Spotify" />

        <p className="text-xs text-zinc-700 mt-4">
          Solo se solicitan permisos de lectura. No modificamos tu cuenta.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-14 w-full">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/50"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-rose-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-200 mb-1">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-zinc-700">
        <Link href="#" className="hover:text-zinc-500 transition-colors">
          Privacidad
        </Link>
        {' · '}
        <span>DuoVibe © 2026</span>
      </footer>
    </main>
  );
}
