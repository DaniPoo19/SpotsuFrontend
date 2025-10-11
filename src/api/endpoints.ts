/**
 * Endpoints centralizados para la API
 * Estos endpoints son relativos a la baseURL definida en axiosInstance
 * La baseURL es '/api' - todos estos paths se concatenan a ese prefijo
 */

const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout'
  },
  // People
  PEOPLE: {
    BASE: '/people',
    BY_ID: (id: string) => `/people/${id}`,
  },
  // Athletes
  ATHLETES: {
    BASE: '/athletes',
    BY_ID: (id: string) => `/athletes/${id}`,
  },
  // Sports
  SPORTS: {
    BASE: '/sports',
    BY_ID: (id: string) => `/sports/${id}`,
  },
  // Sport Histories
  SPORT_HISTORIES: {
    BASE: '/sport-histories',
    BY_ID: (id: string) => `/sport-histories/${id}`,
  },
  // Sports Achievements
  SPORTS_ACHIEVEMENTS: {
    BASE: '/sports-achievements',
    BY_ID: (id: string) => `/sports-achievements/${id}`,
    BY_SPORT_HISTORY: (sportHistoryId: string) => `/sports-achievements/sport-history/${sportHistoryId}`,
  },
  // Competition Categories
  COMPETITION_CATEGORIES: {
    BASE: '/sports-competition-categories',
    BY_ID: (id: string) => `/sports-competition-categories/${id}`,
  },
  // Competition Hierarchy
  COMPETITION_HIERARCHY: {
    BASE: '/sports-competition-hierarchy',
    BY_ID: (id: string) => `/sports-competition-hierarchy/${id}`,
    BY_CATEGORY: (categoryId: string) => `/sports-competition-hierarchy/by-category/${categoryId}`,
  },
  // Attached Documents
  ATTACHED_DOCUMENTS: {
    BASE: '/attached-documents',
    BY_ID: (id: string) => `/attached-documents/${id}`,
    BY_REFERENCE: (referenceId: string, referenceType: string) => 
      `/attached-documents/reference/${referenceId}/${referenceType}`,
  },
  // Masters
  MASTERS: {
    DOCUMENT_TYPES: '/document-types',
    GENDERS: '/genders',
    BASE: '/masters',
    BY_ID: (id: string) => `/masters/${id}`,
  },
  PARQ: {
    QUESTIONS: '/par-q',
    RESPONSES: '/par-q-responses',
  },
  // Postulations
  POSTULATIONS: {
    BASE: '/postulations',
    CURRENT: '/postulations/current',
    BY_ID: (id: string) => `/postulations/${id}`,
  },
  // Postulation Sports
  POSTULATION_SPORTS: {
    BASE: '/postulation-sports',
    BY_ID: (id: string) => `/postulation-sports/${id}`,
  },
  // Postulation Sport Achievements
  POSTULATION_SPORT_ACHIEVEMENTS: {
    BASE: '/postulation-sport-achievements',
    BY_ID: (id: string) => `/postulation-sport-achievements/${id}`,
  },
};

export default API_ENDPOINTS; 