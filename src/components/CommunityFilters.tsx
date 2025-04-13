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

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <select
        name="condition"
        value={filters.condition}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
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

      <select
        name="location"
        value={filters.location}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
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

      <select
        name="medication"
        value={filters.medication}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
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

      <select
        name="privacy"
        value={filters.privacy}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
      >
        <option value="">All Privacy Settings</option>
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    </div>
  );
};

export default CommunityFilters; 