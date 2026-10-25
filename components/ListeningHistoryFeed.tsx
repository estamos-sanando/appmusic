'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ListeningHistoryItem } from '@/types';
import { formatTime, truncate } from '@/lib/utils';
import { Music } from 'lucide-react';

interface ListeningHistoryFeedProps {
  history: ListeningHistoryItem[];
  myUserId: string;
  myName: string;
  partnerName: string;
  isLoading?: boolean;
}

export function ListeningHistoryFeed({
  history,
  myUserId,
  myName,
  partnerName,
  isLoading = false,
}: ListeningHistoryFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
              <div className="h-3 bg-zinc-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Music size={36} className="text-zinc-700 mb-3" strokeWidth={1} />
        <p className="text-sm text-zinc-500">El historial del día aparecerá aquí</p>
        <p className="text-xs text-zinc-700 mt-1">Empezá a escuchar música en Spotify</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
      {history.map((item, idx) => {
        const isMe = item.user_id === myUserId;
        const name = isMe ? myName : partnerName;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: isMe ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-zinc-800/40 group ${
              isMe ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            {/* Album Art */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700/40">
              {item.album_art_url ? (
                <Image
                  src={item.album_art_url}
                  alt={item.album_name ?? 'Album'}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={16} className="text-zinc-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className={`flex-1 min-w-0 ${isMe ? 'text-left' : 'text-right'}`}>
              <p className="text-sm font-medium text-zinc-200 truncate leading-tight">
                {truncate(item.track_name, 35)}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {truncate(item.artist_name, 30)}
              </p>
            </div>

            {/* Time + User */}
            <div className={`flex flex-col items-${isMe ? 'end' : 'start'} gap-0.5 shrink-0`}>
              <span className="text-xs text-zinc-600 tabular-nums">
                {formatTime(item.played_at)}
              </span>
              <span
                className={`text-xs font-medium ${isMe ? 'text-rose-400' : 'text-blue-400'}`}
              >
                {isMe ? 'Tú' : name}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
