export interface CulturalEvent {
  id: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  imageUrl: string;
  description?: string;
  location?: string;
  mapsUrl?: string;
  cost?: string;
  price?: number;
}

export enum EventCategory {
  ALL = 'Todas',
  MUSIC = 'Música',
  VISUAL_ARTS = 'Artes Visuales',
  THEATER = 'Teatro',
  DANCE = 'Danza',
  LITERATURE = 'Literatura',
  CINEMA = 'Cine',
  WORKSHOPS = 'Talleres y Charlas'
}

export interface FilterState {
  category: string;
  dateStart: string;
  dateEnd: string;
  searchQuery: string;
}

export type ViewMode = 'home' | 'admin';
