import { Contact } from '../types';

export type SortField = 'name' | 'company' | 'email' | 'phone' | 'title';
export type SortDirection = 'asc' | 'desc';

export const sortContacts = (
  contacts: Contact[],
  field: SortField,
  direction: SortDirection
): Contact[] => {
  return [...contacts].sort((a, b) => {
    const aValue = (a[field] || '').toLowerCase();
    const bValue = (b[field] || '').toLowerCase();
    
    if (direction === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  });
};

export const exportToCSV = (contacts: Contact[]): string => {
  const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'Website', 'Address'];
  const rows = contacts.map(contact => [
    contact.name || '',
    contact.title || '',
    contact.company || '',
    contact.email || '',
    contact.phone || '',
    contact.website || '',
    contact.address || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (contacts: Contact[], filename: string = 'contacts.csv') => {
  const csv = exportToCSV(contacts);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
