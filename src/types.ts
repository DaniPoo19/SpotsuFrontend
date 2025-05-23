export interface Aspirant {
  id: string;
  name: string;
  gender: 'male' | 'female';
  discipline: string;
  documents: {
    sportsCertificate: boolean;
    medicalCertificate: boolean;
    consentForm: boolean;
  };
  evaluated?: boolean;
  sportsHistory: {
    sport: string;
    years: number;
    level: 'Municipal' | 'Departamental' | 'Nacional' | 'Internacional';
    competition: string;
    certificate?: string;
    approved?: boolean;
  }[];
  personalInfo: {
    email: string;
    phone: string;
    emergencyPhone: string;
    birthDate: string;
    address: string;
    city: string;
    state: string;
    country: string;
    idType: 'TI' | 'CC' | 'CE' | 'Pasaporte';
    idNumber: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  avatar: string;
}