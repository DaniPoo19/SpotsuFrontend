import { Aspirant, User } from './types';

export const currentUser: User = {
  id: '1',
  name: 'Admin Usuario',
  email: 'admin@spostu.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
};

export const mockAspirants: Aspirant[] = [
  {
    id: '1',
    name: 'Ana María García López',
    gender: 'female',
    discipline: 'Natación',
    level: 'advanced',
    documents: {
      sportsCertificate: true,
      medicalCertificate: true,
      consentForm: true
    },
    sportsHistory: [
      {
        sport: 'Natación',
        years: 8,
        level: 'Nacional',
        competition: 'Campeonato Nacional 2023',
        certificate: 'certificate1.pdf'
      },
      {
        sport: 'Natación',
        years: 6,
        level: 'Internacional',
        competition: 'Sudamericano Junior 2022',
        certificate: 'certificate2.pdf'
      }
    ],
    personalInfo: {
      email: 'ana.garcia@email.com',
      phone: '555-0123',
      emergencyPhone: '555-9876',
      birthDate: '1998-05-15',
      address: 'Calle Principal 123',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'Colombia',
      idType: 'CC',
      idNumber: '1234567890'
    }
  },
  {
    id: '2',
    name: 'Carlos Eduardo Rodríguez Martínez',
    gender: 'male',
    discipline: 'Atletismo',
    level: 'intermediate',
    documents: {
      sportsCertificate: true,
      medicalCertificate: false,
      consentForm: true
    },
    sportsHistory: [
      {
        sport: 'Atletismo',
        years: 4,
        level: 'Departamental',
        competition: 'Juegos Departamentales 2023',
        certificate: 'certificate3.pdf'
      }
    ],
    personalInfo: {
      email: 'carlos.rodriguez@email.com',
      phone: '555-0124',
      emergencyPhone: '555-4321',
      birthDate: '2000-08-22',
      address: 'Avenida Central 456',
      city: 'Medellín',
      state: 'Antioquia',
      country: 'Colombia',
      idType: 'CC',
      idNumber: '0987654321'
    }
  },
  {
    id: '3',
    name: 'Valentina Torres Ramírez',
    gender: 'female',
    discipline: 'Fútbol',
    level: 'advanced',
    documents: {
      sportsCertificate: true,
      medicalCertificate: true,
      consentForm: true
    },
    sportsHistory: [
      {
        sport: 'Fútbol',
        years: 10,
        level: 'Nacional',
        competition: 'Liga Femenina 2023',
        certificate: 'certificate4.pdf'
      }
    ],
    personalInfo: {
      email: 'valentina.torres@email.com',
      phone: '555-0125',
      emergencyPhone: '555-5678',
      birthDate: '1999-03-10',
      address: 'Carrera 45 #78-90',
      city: 'Cali',
      state: 'Valle del Cauca',
      country: 'Colombia',
      idType: 'CC',
      idNumber: '2345678901'
    }
  },
  {
    id: '4',
    name: 'Juan Pablo Herrera Mendoza',
    gender: 'male',
    discipline: 'Baloncesto',
    level: 'intermediate',
    documents: {
      sportsCertificate: true,
      medicalCertificate: true,
      consentForm: false
    },
    sportsHistory: [
      {
        sport: 'Baloncesto',
        years: 6,
        level: 'Departamental',
        competition: 'Copa Universitaria 2023',
        certificate: 'certificate5.pdf'
      }
    ],
    personalInfo: {
      email: 'juan.herrera@email.com',
      phone: '555-0126',
      emergencyPhone: '555-8765',
      birthDate: '2001-11-28',
      address: 'Calle 67 #23-45',
      city: 'Barranquilla',
      state: 'Atlántico',
      country: 'Colombia',
      idType: 'CC',
      idNumber: '3456789012'
    }
  }
];