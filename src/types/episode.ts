export interface Episode {
  id: string;
  showId: string;
  title: string;
  order: number;
  muxPlaybackId: string;
  muxPlaybackUrl?: string; // Signed playback URL (added by server)
  durationSec: number;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EpisodeWithWatchStatus extends Episode {
  watched: boolean;
}

