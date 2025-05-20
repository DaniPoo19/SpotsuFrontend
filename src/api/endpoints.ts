/**
 * Endpoints centralizados para la API
 * Estos endpoints son relativos a la baseURL definida en axiosInstance
 * La baseURL ya incluye el prefijo '/spotsu/api/v1'
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
    BASE: '/competition-hierarchy',
    BY_ID: (id: string) => `/competition-hierarchy/${id}`,
    BY_CATEGORY: (categoryId: string) => `/competition-hierarchy/category/${categoryId}`,
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
    RESPONSES: '/par-qresponses',
  },
};

export default API_ENDPOINTS; 