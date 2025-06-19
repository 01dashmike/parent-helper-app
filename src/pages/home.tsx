import Header from "@/components/header";
import { EnhancedHero } from "@/components/enhanced-hero";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { useRef, useEffect } from "react";

export default function Home() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Scroll to results when search is performed
  useEffect(() => {
    if (searchResults.length > 0 && searchResultsRef.current) {
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100); // Small delay to ensure results are rendered
    }
  }, [searchResults]);



  return (
    <div className="min-h-screen bg-white">
      <Header />
      <EnhancedHero />
      
      {searchResults.length > 0 && (
        <div ref={searchResultsRef}>
          <SearchResults 
            results={searchResults} 
            searchParams={searchParams}
            isLoading={isLoading}
          />
        </div>
      )}
      
      <Newsletter />
      <Footer />
    </div>
  );
}
