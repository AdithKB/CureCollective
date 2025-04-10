import React from 'react';
import { locations } from '../data/locations';
import { healthConditions } from '../data/healthConditions';
import { medicines } from '../data/medicines';
import '../styles/CommunityFilters.css';

interface FilterProps {
  onFilterChange: (filters: {
    location: string;
    condition: string;
    medication: string;
  }) => void;
}

const CommunityFilters: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = React.useState({
    location: '',
    condition: '',
    medication: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label htmlFor="location">Location</label>
        <select
          id="location"
          name="location"
          value={filters.location}
          onChange={handleChange}
        >
          <option value="">All Locations</option>
          {locations.map(location => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="condition">Health Condition</label>
        <select
          id="condition"
          name="condition"
          value={filters.condition}
          onChange={handleChange}
        >
          <option value="">All Conditions</option>
          {healthConditions.map(condition => (
            <option key={condition.value} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="medication">Medication</label>
        <select
          id="medication"
          name="medication"
          value={filters.medication}
          onChange={handleChange}
        >
          <option value="">All Medications</option>
          {medicines.map(medicine => (
            <option key={medicine.value} value={medicine.value}>
              {medicine.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CommunityFilters; 