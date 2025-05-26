import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Baby, Users, Camera, Clock } from "lucide-react";

export default function Home() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();

  const mainCategories = [
    {
      title: "Baby & Toddler Classes",
      description: "Music, swimming, sensory play, and development classes for 0-5 years",
      icon: <Baby className="w-12 h-12" />,
      href: "/baby-toddler-classes",
      color: "bg-teal-600 hover:bg-teal-700",
      count: "5,600+ classes"
    },
    {
      title: "Family Services",
      description: "Photography, keepsakes, baby scans, and bespoke family services",
      icon: <Camera className="w-12 h-12" />,
      href: "/family-services",
      color: "bg-purple-600 hover:bg-purple-700",
      count: "Coming soon"
    },
    {
      title: "After School Clubs",
      description: "Sports, academic, and activity clubs for school-age children",
      icon: <Clock className="w-12 h-12" />,
      href: "/after-school-clubs",
      color: "bg-coral-600 hover:bg-coral-700",
      count: "Expanding"
    },
    {
      title: "Weekend Activities",
      description: "Fun weekend programs and activities for the whole family",
      icon: <Users className="w-12 h-12" />,
      href: "/after-school-clubs",
      color: "bg-sage-600 hover:bg-sage-700",
      count: "Growing"
    }
  ];

  return (
    <div className="min-h-screen bg-warm-gray">
      <Header />
      <HeroSearch onSearch={performSearch} isLoading={isLoading} />
      
      {/* Featured Categories Section - Always visible */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Categories</h2>
            <p className="text-gray-600">Quick access to our most searched services</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Baby Music", category: "music", icon: "🎵" },
              { name: "Swimming", category: "swimming", icon: "🏊‍♀️" },
              { name: "Baby Massage", category: "massage", icon: "👶" },
              { name: "Sensory Play", category: "sensory", icon: "🎨" }
            ].map((cat, index) => (
              <button
                key={index}
                onClick={() => performSearch({ postcode: "London", category: cat.category, radius: 10, includeInactive: false })}
                className="bg-teal-50 hover:bg-teal-100 rounded-lg p-4 text-center transition-colors group"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="text-sm font-medium text-teal-700 group-hover:text-teal-800">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
      
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
