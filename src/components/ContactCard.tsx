import React from 'react';
import { Trash2, Copy, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { ContactInfo } from '../types';

interface ContactCardProps {
  contact: ContactInfo;
  onDelete: (id: string) => void;
}

export function ContactCard({ contact, onDelete }: ContactCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{contact.name}</h3>
          {contact.title && (
            <p className="text-gray-600">{contact.title}</p>
          )}
          {contact.company && (
            <p className="text-gray-600">{contact.company}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(contact.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {contact.email && (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{contact.email}</span>
            <button
              onClick={() => copyToClipboard(contact.email!)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{contact.phone}</span>
            <button
              onClick={() => copyToClipboard(contact.phone!)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
        {contact.website && (
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span>{contact.website}</span>
            <button
              onClick={() => copyToClipboard(contact.website!)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
        {contact.address && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{contact.address}</span>
            <button
              onClick={() => copyToClipboard(contact.address!)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}