import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";

export default function Home() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();

  return (
    <div className="min-h-screen bg-warm-gray">
      <Header />
      <HeroSearch onSearch={performSearch} isLoading={isLoading} />
      {searchResults.length > 0 && (
        <SearchResults 
          results={searchResults} 
          searchParams={searchParams}
          isLoading={isLoading}
        />
      )}
      <Newsletter />
      <Footer />
    </div>
  );
}
