import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ClassCard from "@/components/class-card";
import { Loader2, Search } from "lucide-react";

export default function SmartSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, []);

  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["/api/classes/smart-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await fetch(`/api/classes/smart-search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: !!searchQuery,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-coral" />
            <h1 className="text-3xl font-bold text-teal-dark">
              Smart Search Results
            </h1>
          </div>
          
          {searchQuery && (
            <p className="text-lg text-gray-600">
              Searching for: "<span className="font-semibold text-teal-dark">{searchQuery}</span>"
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
            <span className="ml-2 text-gray-600">Finding classes...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Search failed. Please try again.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors"
            >
              Back to Search
            </button>
          </div>
        )}

        {classes && classes.length > 0 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Found {classes.length} {classes.length === 1 ? 'class' : 'classes'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem: any) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          </div>
        )}

        {classes && classes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No classes found for "{searchQuery}". Try a different search term.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors"
            >
              Try Another Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}