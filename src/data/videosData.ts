export interface MasjidVideoItem {
  id: string; // YouTube Video ID
  title: string;
  category?: string;
  duration?: string;
  date?: string;
  youtubeUrl: string;
  description?: string;
}

/**
 * Reusable list of YouTube videos displayed on the Sirajan Muneera App Home Page.
 */
export const LATEST_MASJID_VIDEOS: MasjidVideoItem[] = [
  {
    id: 'fokaam6BMWY',
    title: 'Sirajan Muneera - Community Gathering & Jummah Khutbah',
    category: 'Jummah & Khutbah',
    duration: 'Khutbah',
    date: 'Recent Update',
    youtubeUrl: 'https://www.youtube.com/watch?v=fokaam6BMWY',
    description: 'Weekly Jummah Khutbah and spiritual reminder at Sirajan Muneera.'
  },
  {
    id: '9e3Fn0FOlhg',
    title: 'Sirajan Muneera - Special Bayan & Dawah Program',
    category: 'Islamic Lecture',
    duration: 'Lecture',
    date: 'Recent Update',
    youtubeUrl: 'https://www.youtube.com/watch?v=9e3Fn0FOlhg',
    description: 'Special educational program and speech conducted at Sirajan Muneera.'
  },
  {
    id: 'OeSpmt7AtE8',
    title: 'Sirajan Muneera - Quran Recitation & Reflections',
    category: 'Quran & Tilawat',
    duration: 'Tilawat',
    date: 'Recent Update',
    youtubeUrl: 'https://www.youtube.com/watch?v=OeSpmt7AtE8',
    description: 'Heartfelt Quran recitation and spiritual reflections at Sirajan Muneera.'
  },
  {
    id: 'YgL9NOY8M6I',
    title: 'Sirajan Muneera - Community Welfare & Updates',
    category: 'Community News',
    duration: 'Community Update',
    date: 'Recent Update',
    youtubeUrl: 'https://www.youtube.com/watch?v=YgL9NOY8M6I',
    description: 'Latest community development, maintenance, and facility updates from Sirajan Muneera.'
  }
];
