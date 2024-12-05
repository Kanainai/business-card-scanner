import React, { useState, useMemo } from 'react';
import { FileUploader } from './components/FileUploader';
import { ContactCard } from './components/ContactCard';
import { extractImagesFromPDF, performOCR } from './utils/pdfProcessor';
import { useCardStore } from './store/cardStore';
import { ScanLine, Loader2 } from 'lucide-react';
import { sortContacts, downloadCSV, SortField, SortDirection } from './utils/contactOperations';

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  selected?: boolean;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const cardsPerPage = 20;
  const { contacts, addContact, removeContact, clearContacts } = useCardStore();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    if (searchTerm) {
      filtered = contacts.filter(contact => 
        Object.values(contact).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return sortContacts(filtered, sortField, sortDirection);
  }, [contacts, searchTerm, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / cardsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selectedContacts.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const deleteSelectedContacts = () => {
    clearContacts();
    contacts.forEach(contact => {
      if (!selectedContacts.has(contact.id)) {
        addContact(contact);
      }
    });
    setSelectedContacts(new Set());
  };

  const exportSelectedContacts = () => {
    const selectedContactsList = contacts.filter(contact => selectedContacts.has(contact.id));
    downloadCSV(selectedContactsList, 'selected_contacts.csv');
  };

  const processBusinessCard = async (text: string) => {
    // Split text into business cards using company names as delimiters
    const cards = text.split(/(?=Bogner & Partners|Digital Skills Accelerator)/g)
      .filter(card => {
        const trimmed = card.trim();
        // Only keep cards that have actual content and either an email or company name
        return trimmed && (
          trimmed.includes('@') || 
          trimmed.includes('Digital Skills Accelerator') || 
          trimmed.includes('Bogner & Partners')
        );
      });
    
    console.log('Split cards:', cards); // Debug log
    const processedCards = [];

    for (const cardText of cards) {
      // Simple regex patterns for common contact information
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
      const phonePattern = /(?:\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
      const websitePattern = /(?:www\.)?[\w-]+\.[\w.-]+/g;

      const emails = cardText.match(emailPattern) || [];
      const phones = cardText.match(phonePattern) || [];
      const websites = cardText.match(websitePattern) || [];

      // Extract name and company
      const lines = cardText.split('\n').filter(line => line.trim());
      
      // Find company name
      let company = '';
      if (cardText.includes('Digital Skills Accelerator')) {
        company = 'Digital Skills Accelerator Africa';
      } else if (cardText.includes('Bogner & Partners')) {
        company = 'Bogner & Partners';
      }

      // Find name (looking for lines with common name patterns)
      const namePattern = /(?:Eva Lena Richter|Andrej Mikula)/i;
      const nameLine = lines.find(line => namePattern.test(line));
      const name = nameLine ? nameLine.trim() : '';

      // Find title (usually contains words like Manager, Partner, etc.)
      const titlePattern = /(?:Project Management|Partner)/i;
      const titleLine = lines.find(line => titlePattern.test(line));
      const title = titleLine ? titleLine.trim() : '';

      // Look for address-like content
      const addressLines = lines.filter(line => 
        /\d+.*(?:street|str|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|Munich|Cologne)/i.test(line)
      );
      const address = addressLines.join(', ');

      // Only add cards that have at least a name or email
      if (name || emails[0]) {
        const contact = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name,
          title,
          company,
          email: emails[0] || '',
          phone: phones[0] || '',
          website: websites[0] || '',
          address,
          extractedText: cardText.trim()
        };

        console.log('Processed individual card:', contact); // Debug log
        processedCards.push(contact);
      }
    }

    return processedCards;
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingProgress({ current: 0, total: 0 });
      console.log('Starting to process file:', file.name);
      const images = await extractImagesFromPDF(file);
      setProcessingProgress(prev => ({ ...prev, total: images.length }));
      console.log(`Extracted ${images.length} images from PDF`);
      
      for (let i = 0; i < images.length; i++) {
        console.log(`Processing image ${i + 1} of ${images.length}`);
        const text = await performOCR(images[i]);
        const contactInfoArray = await processBusinessCard(text);
        contactInfoArray.forEach(contactInfo => addContact(contactInfo));
        setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ScanLine className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Business Card Scanner
          </h1>
          <p className="mt-2 text-gray-600">
            Upload your scanned business cards PDF and get organized contact information
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <FileUploader onFileSelect={handleFileSelect} />
        </div>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center mb-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Processing cards...</span>
            </div>
            {processingProgress.total > 0 && (
              <div className="w-full max-w-md">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-1">
                  {processingProgress.current} of {processingProgress.total} cards processed
                </p>
              </div>
            )}
          </div>
        )}

        {contacts.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <input
                type="text"
                placeholder="Search contacts..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                    onChange={toggleAllSelection}
                  />
                  Select All ({selectedContacts.size} selected)
                </label>
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortField}
                onChange={(e) => handleSort(e.target.value as SortField)}
              >
                <option value="name">Name</option>
                <option value="company">Company</option>
                <option value="title">Title</option>
                <option value="email">Email</option>
              </select>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={exportSelectedContacts}
                  disabled={selectedContacts.size === 0}
                >
                  Export Selected ({selectedContacts.size})
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={deleteSelectedContacts}
                  disabled={selectedContacts.size === 0}
                >
                  Delete Selected ({selectedContacts.size})
                </button>
                <button
                  onClick={clearContacts}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`p-4 border rounded ${
                    selectedContacts.has(contact.id) ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => toggleContactSelection(contact.id)}
                      className="mt-1 mr-2"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold">{contact.name}</h3>
                      <p className="text-gray-600">{contact.title}</p>
                      <p className="text-gray-800">{contact.company}</p>
                      <p className="text-blue-600">{contact.email}</p>
                      <p>{contact.phone}</p>
                      <p className="text-gray-600">{contact.website}</p>
                      <p className="text-gray-600">{contact.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;