import { create } from 'zustand';
import { ContactInfo, CardStore } from '../types';

export const useCardStore = create<CardStore>((set) => ({
  contacts: [],
  addContact: (contact) =>
    set((state) => ({ contacts: [...state.contacts, contact] })),
  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
    })),
  clearContacts: () => set({ contacts: [] }),
}));