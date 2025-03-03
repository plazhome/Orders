import React, { useState, useEffect, useRef } from 'react';
import styles from './Cart.module.scss';

interface City {
  name: string;
  lat: string;
  lng: string;
  distance?: number; // Optional distance from store location
}

interface CityAutocompleteProps {
  value: string;
  onChange: (city: City) => void;
  onError?: (error: string) => void;
  className?: string;
  errorText?: string;
}

// Store location coordinates (Athens as default)
const STORE_LOCATION = {
  lat: 37.9838,
  lng: 23.7275
};

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  onError,
  className,
  errorText
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Calculate distance between two coordinates (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return Math.round(distance);
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for cities using GeoNames API
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use GeoNames API to search for Greek cities
      // Note: For production, you'd want to proxy this through your backend to secure your username
      const response = await fetch(
        `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(query)}&country=GR&featureClass=P&maxRows=10&username=demo`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const data = await response.json();
      
      if (data.geonames) {
        const cities = data.geonames.map((city: any) => {
          const distance = calculateDistance(
            STORE_LOCATION.lat, 
            STORE_LOCATION.lng, 
            parseFloat(city.lat), 
            parseFloat(city.lng)
          );
          
          return {
            name: city.name,
            lat: city.lat,
            lng: city.lng,
            distance
          };
        });
        
        setSuggestions(cities);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      if (onError) {
        onError('Could not fetch cities. Please try again or enter manually.');
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchTerm(value);
    
    // Trigger search after a short delay
    const debounceTimeout = setTimeout(() => {
      searchCities(value);
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  };

  // Handle city selection
  const handleSelectCity = (city: City) => {
    setSearchTerm(city.name);
    onChange(city);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className={styles.autocompleteContainer}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Start typing your city..."
        onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
        className={`${className || ''} ${errorText ? styles.errorInput : ''}`}
      />
      {errorText && <span className={styles.errorText}>{errorText}</span>}
      
      {isLoading && <div className={styles.loadingIndicator}>Loading...</div>}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((city, index) => (
            <li 
              key={`${city.name}-${index}`} 
              onClick={() => handleSelectCity(city)}
              className={styles.suggestionItem}
            >
              <span>{city.name}</span>
              <span className={styles.distanceBadge}>{city.distance} km</span>
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && !isLoading && suggestions.length === 0 && searchTerm.length >= 2 && (
        <div className={styles.noResults}>No cities found. Please try another name.</div>
      )}
    </div>
  );
};

export default CityAutocomplete; 