import Header from "@/components/header";
import HeroSearch from "@/components/hero-search";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Heart, Baby, Palette, Gift, Star, ArrowRight, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sage/10 via-lavender/10 to-coral/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-coral mr-2" />
            <span className="text-sm font-medium text-teal-dark">Professional Family Services</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-teal-dark mb-6 leading-tight">
            Family Services & 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-sage"> Specialists</span>
          </h1>
          
          <p className="text-xl text-sage mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover trusted family photographers, bespoke baby services, and specialized providers 
            to capture and celebrate your precious moments across England
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="bg-coral/10 text-coral border-coral/20">
              Photography & Portraits
            </Badge>
            <Badge variant="secondary" className="bg-sage/10 text-sage border-sage/20">
              Baby Keepsakes
            </Badge>
            <Badge variant="secondary" className="bg-lavender/10 text-lavender border-lavender/20">
              Health & Wellness
            </Badge>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-teal-dark mb-4">
              Browse Service Categories
            </h2>
            <p className="text-lg text-sage max-w-2xl mx-auto">
              From capturing precious moments to creating lasting memories, find the perfect specialists for your family
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((service, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold font-poppins text-teal-dark mb-3">{service.title}</h3>
                  <p className="text-sage mb-6 leading-relaxed">{service.description}</p>
                  <Button 
                    onClick={() => handleCategorySearch(service.category)}
                    className="w-full bg-gradient-to-r from-coral to-coral/90 hover:from-coral/90 hover:to-coral text-white rounded-xl font-medium group-hover:shadow-lg transition-all duration-300"
                  >
                    Find {service.title}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
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