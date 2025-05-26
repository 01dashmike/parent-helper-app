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
      
      {/* Main Categories Section */}
      {searchResults.length === 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Discover What's Perfect for Your Family
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From baby classes to family services, find everything you need for your parenting journey
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {mainCategories.map((category, index) => (
                <Link key={index} href={category.href}>
                  <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="text-teal-600 mb-4 flex justify-center">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-3">{category.title}</h3>
                    <p className="text-gray-600 text-center mb-4 text-sm leading-relaxed">
                      {category.description}
                    </p>
                    <div className="text-center">
                      <span className="text-sm font-medium text-teal-600">{category.count}</span>
                      <Button className={`w-full mt-3 ${category.color} text-white`}>
                        Explore
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      
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
