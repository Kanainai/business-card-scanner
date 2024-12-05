export interface ContactInfo {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  extractedText: string;
}

export interface CardStore {
  contacts: ContactInfo[];
  addContact: (contact: ContactInfo) => void;
  removeContact: (id: string) => void;
  clearContacts: () => void;
}