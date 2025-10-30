import { EpisodeWithWatchStatus } from './episode';

export interface Show {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  likes: number;
  dislikes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowWithEpisodes extends Show {
  episodes: EpisodeWithWatchStatus[];
}

