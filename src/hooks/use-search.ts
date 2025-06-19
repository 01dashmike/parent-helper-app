import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Class, SearchParams } from "@shared/schema";

export function useSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const { data: searchResults = [], isLoading, error } = useQuery<Class[]>({
    queryKey: ["/api/classes/search", searchParams],
    enabled: !!searchParams,
    queryFn: async () => {
      if (!searchParams) return [];
      
      const urlParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/classes/search?${urlParams}`);
      if (!response.ok) {
        throw new Error('Failed to search classes');
      }
      return response.json();
    },
  });

  const performSearch = (params: SearchParams) => {
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchParams(null);
  };

  return {
    searchResults,
    isLoading,
    error,
    searchParams,
    performSearch,
    clearSearch,
  };
}
