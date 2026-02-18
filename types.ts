
export interface Song {
  id: string;
  albumId: string;
  title: string;
  duration: string;
  fileUrl: string;
  coverUrl?: string; // Portada individual opcional para la canción
}

export interface Album {
  id: string;
  bandId: string;
  title: string;
  year: number;
  coverUrl: string;
  genre: string;
  songs: Song[];
}

export interface Band {
  id: string;
  name: string;
  genre: string;
  bio: string;
  imageUrl: string;
  albums: Album[];
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  BAND_DETAIL = 'BAND_DETAIL',
  ALBUM_DETAIL = 'ALBUM_DETAIL'
}
