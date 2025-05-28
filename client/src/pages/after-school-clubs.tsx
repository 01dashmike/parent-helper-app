import { useQuery } from '@tanstack/react-query';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, MapPin, Users, Star, Phone, Mail, Globe, Sparkles, GraduationCap } from 'lucide-react';
import { useState } from 'react';

interface AfterSchoolClub {
  id: number;
  name: string;
  description: string;
  address: string;
  town: string;
  postcode: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price: string;
  rating: string;
  reviewCount: number;
  contactPhone: string;
  contactEmail: string;
  website: string;
  category: string;
  timeOfDay: string;
  dayOfWeek: string;
}

export default function AfterSchoolClubsPage() {
  const [searchLocation, setSearchLocation] = useState('');

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ['/api/classes/search', { category: 'After School Clubs', postcode: searchLocation || 'London' }],
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger new search
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sage/10 via-lavender/10 to-coral/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-coral mr-2" />
            <span className="text-sm font-medium text-teal-dark">After School Activities</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-teal-dark mb-6 leading-tight">
            After School 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-sage"> Clubs</span>
          </h1>
            <p className="text-xl md:text-2xl mb-8 text-teal-100">
              Discover amazing after school activities and clubs for school-age children across the UK
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter your town or postcode..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>
                <Button type="submit" variant="secondary" className="px-8">
                  Search Clubs
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Categories Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
              Popular Club Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { name: 'Sports Clubs', icon: '⚽', color: 'bg-blue-100 text-blue-800' },
                { name: 'Arts & Crafts', icon: '🎨', color: 'bg-purple-100 text-purple-800' },
                { name: 'STEM Clubs', icon: '🧪', color: 'bg-green-100 text-green-800' },
                { name: 'Drama & Theatre', icon: '🎭', color: 'bg-pink-100 text-pink-800' },
                { name: 'Music Groups', icon: '🎵', color: 'bg-yellow-100 text-yellow-800' },
                { name: 'Coding & Tech', icon: '💻', color: 'bg-indigo-100 text-indigo-800' },
                { name: 'Language Clubs', icon: '🌍', color: 'bg-orange-100 text-orange-800' },
                { name: 'Outdoor Adventures', icon: '🏕️', color: 'bg-emerald-100 text-emerald-800' }
              ].map((category) => (
                <div key={category.name} className={`${category.color} rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow`}>
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="font-semibold text-sm">{category.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                After School Clubs Near You
              </h2>
              <Badge variant="secondary" className="text-sm">
                {(clubs as AfterSchoolClub[]).length} clubs found
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (clubs as AfterSchoolClub[]).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(clubs as AfterSchoolClub[]).map((club: AfterSchoolClub) => (
                  <Card key={club.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-gray-800 dark:text-white">
                          {club.name}
                        </CardTitle>
                        {club.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">{club.rating}</span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        {club.town}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                        {club.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Ages {club.ageGroupMin}-{club.ageGroupMax}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {club.timeOfDay}
                        </Badge>
                        {club.price && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            {club.price}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {club.contactPhone && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Call
                            </Button>
                          )}
                          {club.contactEmail && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </Button>
                          )}
                          {club.website && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Website
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No after school clubs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try searching for a different location or check back soon for new clubs.
                </p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Why Choose After School Clubs?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Skill Development</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Children develop new skills and explore interests beyond the school curriculum.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Social Interaction</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Build friendships and develop social skills in a structured environment.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Confidence Building</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Boost self-esteem through achievement and positive experiences.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Safe Environment</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Supervised activities in a safe, nurturing environment after school hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}