import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import { Clock, Users, Trophy, Book, Music, Dumbbell } from "lucide-react";

export default function Clubs() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();

  const clubCategories = [
    {
      title: "After School Clubs",
      description: "Educational and fun activities for school-age children after school hours",
      icon: <Clock className="w-8 h-8" />,
      category: "after-school",
      color: "bg-purple-100 text-purple-700",
      ageRange: "48-144" // 4-12 years
    },
    {
      title: "Weekend Clubs",
      description: "Saturday and Sunday activities to keep children engaged and active",
      icon: <Users className="w-8 h-8" />,
      category: "weekend",
      color: "bg-teal-100 text-teal-700",
      ageRange: "24-144" // 2-12 years
    },
    {
      title: "Sports Clubs",
      description: "Football, rugby, tennis, and other sports clubs for young athletes",
      icon: <Trophy className="w-8 h-8" />,
      category: "sports",
      color: "bg-coral-100 text-coral-700",
      ageRange: "36-180" // 3-15 years
    },
    {
      title: "Academic Clubs",
      description: "Tutoring, homework clubs, and educational enrichment programs",
      icon: <Book className="w-8 h-8" />,
      category: "academic",
      color: "bg-sage-100 text-sage-700",
      ageRange: "48-180" // 4-15 years
    },
    {
      title: "Performing Arts",
      description: "Drama, dance, and music clubs for creative expression",
      icon: <Music className="w-8 h-8" />,
      category: "performing-arts",
      color: "bg-purple-100 text-purple-700",
      ageRange: "36-180" // 3-15 years
    },
    {
      title: "Activity Clubs",
      description: "General activity clubs, youth groups, and hobby-based clubs",
      icon: <Dumbbell className="w-8 h-8" />,
      category: "activities",
      color: "bg-teal-100 text-teal-700",
      ageRange: "60-180" // 5-15 years
    }
  ];

  const handleCategorySearch = (category: string, postcode: string = "London") => {
    performSearch({
      postcode,
      serviceType: "clubs",
      category,
      radius: 10,
      includeInactive: false,
    });
  };

  return (
    <div className="min-h-screen bg-warm-gray">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            After School & Weekend Clubs
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Find engaging after school programs, weekend activities, and clubs 
            to keep your children active, learning, and having fun
          </p>
        </div>
      </section>

      {/* Club Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Club Categories</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubCategories.map((club, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 rounded-full ${club.color} flex items-center justify-center mb-4`}>
                  {club.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{club.title}</h3>
                <p className="text-gray-600 mb-4">{club.description}</p>
                <div className="text-sm text-teal-600 font-medium mb-4">
                  Ages: {Math.floor(parseInt(club.ageRange.split('-')[0]) / 12)}-{Math.floor(parseInt(club.ageRange.split('-')[1]) / 12)} years
                </div>
                <Button 
                  onClick={() => handleCategorySearch(club.category)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Find {club.title}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Section */}
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