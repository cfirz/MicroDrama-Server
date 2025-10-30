export type FilterBy = 'all' | 'watched' | 'unwatched';

export type SortBy = 'title' | 'order' | 'created_at' | 'show_title';

export type OrderBy = 'asc' | 'desc';

export interface FilterOptions {
  filterBy?: FilterBy;
}

export interface SortOptions {
  sortBy?: SortBy;
  orderBy?: OrderBy;
}

