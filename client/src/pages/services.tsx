import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import { Camera, Heart, Baby, Palette, Gift, Star } from "lucide-react";

export default function Services() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();

  const serviceCategories = [
    {
      title: "Family Photography",
      description: "Professional photographers specializing in newborn, maternity, and family portraits",
      icon: <Camera className="w-8 h-8" />,
      category: "photography",
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: "Baby Keepsakes",
      description: "Bespoke ceramics, hand & footprint casting, and personalized baby items",
      icon: <Heart className="w-8 h-8" />,
      category: "keepsakes",
      color: "bg-teal-100 text-teal-700"
    },
    {
      title: "Baby Scans & Health",
      description: "Private ultrasound scans, health checks, and wellness services for babies",
      icon: <Baby className="w-8 h-8" />,
      category: "health",
      color: "bg-coral-100 text-coral-700"
    },
    {
      title: "Custom Baby Items",
      description: "Handmade clothing, personalized gifts, and bespoke nursery items",
      icon: <Palette className="w-8 h-8" />,
      category: "custom",
      color: "bg-sage-100 text-sage-700"
    },
    {
      title: "Party & Events",
      description: "Birthday party organizers, entertainment, and celebration services",
      icon: <Gift className="w-8 h-8" />,
      category: "events",
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: "Premium Services",
      description: "Luxury baby services, consultations, and specialized family support",
      icon: <Star className="w-8 h-8" />,
      category: "premium",
      color: "bg-gold-100 text-gold-700"
    }
  ];

  const handleCategorySearch = (category: string, postcode: string = "London") => {
    performSearch({
      postcode,
      serviceType: "services",
      category,
      radius: 10,
      includeInactive: false,
    });
  };

  return (
    <div className="min-h-screen bg-warm-gray">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Family Services & Specialists
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover trusted family photographers, bespoke baby services, and specialized providers 
            to capture and celebrate your precious moments
          </p>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Service Categories</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 rounded-full ${service.color} flex items-center justify-center mb-4`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <Button 
                  onClick={() => handleCategorySearch(service.category)}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Find {service.title}
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