// src/components/chef/RequestFormHeader.tsx
import React from 'react';
import FormField from '../ui/FormField';
import { RequestPriority } from '../../types/request';

interface RequestFormData {
  menuName: string;
  expectedCovers: number;
  eventDate: string;
  neededBy: string;
  priority: RequestPriority;
  title: string;
}

interface RequestFormHeaderProps {
  formData: RequestFormData;
  onChange: (updates: Partial<RequestFormData>) => void;
}

export const RequestFormHeader: React.FC<RequestFormHeaderProps> = ({ formData, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="menuName" label="Menu/Event Name">
        <input
          id="menuName"
          type="text"
          value={formData.menuName}
          onChange={(e) => onChange({ menuName: e.target.value })}
          placeholder="e.g., Weekend Special, Banquet Menu"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </FormField>

      <FormField id="expectedCovers" label="Expected Covers">
        <input
          id="expectedCovers"
          type="number"
          min="0"
          value={formData.expectedCovers || ''}
          onChange={(e) => onChange({ expectedCovers: parseInt(e.target.value) || 0 })}
          placeholder="Number of guests"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </FormField>

      <FormField id="eventDate" label="Event Date">
        <input
          id="eventDate"
          type="date"
          value={formData.eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </FormField>

      <FormField id="neededBy" label="Ingredients Needed By">
        <input
          id="neededBy"
          type="date"
          value={formData.neededBy}
          onChange={(e) => onChange({ neededBy: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </FormField>
    </div>

    <FormField id="priority" label="Priority">
      <select
        id="priority"
        value={formData.priority}
        onChange={(e) => onChange({ priority: e.target.value as RequestPriority })}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </FormField>

    {formData.title && (
      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm text-gray-600">Request title:</p>
        <p className="font-medium">{formData.title}</p>
      </div>
    )}
  </div>
);