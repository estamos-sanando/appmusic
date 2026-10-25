'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { NowPlaying } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { PulseIndicator } from '@/components/PulseIndicator';
import { TrackProgressBar } from '@/components/TrackProgressBar';
import { NowPlayingSkeleton } from '@/components/ui/Skeleton';
import { cn, truncate } from '@/lib/utils';
import { Music, ExternalLink } from 'lucide-react';

interface NowPlayingCardProps {
  nowPlaying: NowPlaying | null;
  displayName: string;
  avatarUrl?: string | null;
  isMe?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function NowPlayingCard({
  nowPlaying,
  displayName,
  avatarUrl,
  isMe = false,
  isLoading = false,
  className,
}: NowPlayingCardProps) {
  if (isLoading) return <NowPlayingSkeleton />;

  const hasTrack = !!nowPlaying?.track_id;
  const isPlaying = nowPlaying?.is_playing ?? false;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={28} height={28} className="object-cover" />
            ) : (
              <span className="text-xs font-bold text-zinc-400">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-zinc-300 truncate max-w-[120px]">
            {isMe ? 'Tú' : displayName}
          </span>
        </div>
        {hasTrack && (
          <Badge variant={isPlaying ? 'live' : 'paused'}>
            {isPlaying ? (
              <>
                <PulseIndicator active={true} />
                En vivo
              </>
            ) : (
              '⏸ Pausado'
            )}
          </Badge>
        )}
      </div>

      {/* Album Art */}
      <AnimatePresence mode="wait">
        <motion.div
          key={nowPlaying?.track_id ?? 'empty'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-800/80 mb-4 flex-shrink-0"
        >
          {hasTrack && nowPlaying?.album_art_url ? (
            <>
              {/* Blurred background */}
              <div
                className="absolute inset-0 scale-110 blur-2xl opacity-40"
                style={{
                  backgroundImage: `url(${nowPlaying.album_art_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <Image
                src={nowPlaying.album_art_url}
                alt={nowPlaying.album_name ?? 'Album art'}
                fill
                className="object-cover relative z-10"
                sizes="(max-width: 768px) 100vw, 300px"
              />
              {/* Playing animation overlay */}
              {isPlaying && (
                <div className="absolute bottom-2 right-2 z-20 flex gap-0.5 items-end h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-white/80 rounded-full"
                      style={{
                        height: `${Math.random() * 60 + 40}%`,
                        animation: `soundbar 0.${5 + i}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <Music size={48} strokeWidth={1} />
              <p className="text-sm mt-2 text-zinc-600">
                {isMe ? 'Nada sonando' : 'Sin reproducción'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Track Info */}
      {hasTrack ? (
        <div className="flex-1 flex flex-col justify-between">
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 truncate leading-tight">
                  {truncate(nowPlaying!.track_name ?? '', 40)}
                </p>
                <p className="text-sm text-zinc-400 truncate mt-0.5">
                  {truncate(nowPlaying!.artist_name ?? '', 35)}
                </p>
                <p className="text-xs text-zinc-600 truncate mt-0.5">
                  {truncate(nowPlaying!.album_name ?? '', 35)}
                </p>
              </div>
              {nowPlaying?.track_url && (
                <a
                  href={nowPlaying.track_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer mt-0.5"
                  aria-label="Abrir en Spotify"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <TrackProgressBar
            progressMs={nowPlaying?.progress_ms ?? 0}
            durationMs={nowPlaying?.duration_ms ?? 0}
            isPlaying={isPlaying}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-600 italic">
            {isMe ? 'Abrí Spotify y ponete a escuchar algo 🎵' : `${displayName} no está escuchando nada`}
          </p>
        </div>
      )}
    </div>
  );
}
