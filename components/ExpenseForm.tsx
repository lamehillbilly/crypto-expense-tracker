import React from 'react';
import { ExpenseDetails } from '@/types';

interface ExpenseFormProps {
  details: ExpenseDetails;
  onChange: (details: ExpenseDetails) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ details, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <input
        type="text"
        value={details.description}
        onChange={(e) => onChange({ ...details, description: e.target.value })}
        placeholder="Description"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        value={details.vendor || ''}
        onChange={(e) => onChange({ ...details, vendor: e.target.value })}
        placeholder="Vendor (optional)"
        className="w-full p-2 border rounded"
      />
      <select
        value={details.category || ''}
        onChange={(e) => onChange({ ...details, category: e.target.value })}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Category (optional)</option>
        <option value="gas">Gas Fees</option>
        <option value="subscription">Subscription</option>
        <option value="software">Software</option>
        <option value="hardware">Hardware</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};