export interface User {
  id: string;
  email: string;
  document_number: string;
  person: {
    id: string;
    name: string;
    lastName: string;
  };
} 