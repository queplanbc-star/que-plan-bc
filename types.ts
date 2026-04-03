export interface CulturalEvent {
  id: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
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
  VISUAL_ARTS = 'Plásticas y Visuales',
  THEATER = 'Teatro',
  DANCE = 'Danza',
  LITERATURE = 'Literatura',
  CINEMA = 'Cine',
  TALKS = 'Charlas',
  WORKSHOPS = 'Talleres',
  ACTIVATION = 'Activación',
  SHOW = 'Espectáculo',
  EXPERIENCES = 'Experiencias'
}

export interface FilterState {
  category: string;
  dateStart: string;
  dateEnd: string;
  searchQuery: string;
}

export type ViewMode = 'home' | 'admin';
