import React from 'react';
import { healthConditions } from '../data/healthConditions';
import { locations } from '../data/locations';
import { Product } from '../types';

interface Filters {
  location: string;
  condition: string;
  privacy: string;
  medication: string;
}

interface CommunityFiltersProps {
  onFilterChange: (filters: Filters) => void;
  products: Product[];
  initialFilters: Filters;
}

const CommunityFilters: React.FC<CommunityFiltersProps> = ({ onFilterChange, products, initialFilters }) => {
  const [filters, setFilters] = React.useState<Filters>(initialFilters);

  React.useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      location: '',
      condition: '',
      privacy: '',
      medication: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .38-.02.753-.058 1.122h-2.884c-.198-.597-.472-1.133-.811-1.6a5.023 5.023 0 00-2.768-1.78c.399-.34.73-.74.992-1.195.264-.455.422-.94.422-1.455a1.5 1.5 0 00-1.5-1.5H9c-.832 0-1.612.453-2.038 1.09l-.01.014a1.5 1.5 0 00-1.62.523z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            name="condition"
            value={filters.condition}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-md bg-white"
          >
            <option value="">All Health Conditions</option>
            {[...healthConditions]
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            name="location"
            value={filters.location}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-md bg-white"
          >
            <option value="">All Locations</option>
            {[...locations]
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            name="medication"
            value={filters.medication}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-md bg-white"
          >
            <option value="">All Products</option>
            {[...products]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((product) => (
                <option key={product._id} value={product.name}>
                  {product.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="relative w-[calc(33.333%-15px)]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            name="privacy"
            value={filters.privacy}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-md bg-white"
          >
            <option value="">All Privacy Settings</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default CommunityFilters; 