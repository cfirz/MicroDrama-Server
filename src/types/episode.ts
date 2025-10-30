export interface Episode {
  id: string;
  showId: string;
  title: string;
  order: number;
  muxPlaybackId: string;
  durationSec: number;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EpisodeWithWatchStatus extends Episode {
  watched: boolean;
}

