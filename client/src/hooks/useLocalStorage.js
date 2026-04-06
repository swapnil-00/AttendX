import { useState, useEffect } from 'react';

/**
 * Custom hook for localStorage with JSON serialization
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function]} Current value and setter function
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Custom hook for caching API responses
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {[*, boolean, Function]} [data, isLoading, refetch]
 */
export function useCachedData(key, fetcher, ttl = 5 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (force = false) => {
    try {
      const cached = window.localStorage.getItem(key);
      if (cached && !force) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      const freshData = await fetcher();
      const cacheEntry = {
        data: freshData,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(cacheEntry));
      setData(freshData);
    } catch (error) {
      console.error(`Error fetching data for key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [key]);

  return [data, isLoading, () => fetchData(true)];
}
