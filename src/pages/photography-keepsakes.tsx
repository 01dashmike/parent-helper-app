import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Heart, MapPin, Star, Phone, Mail, Globe, Gift, Baby, Users } from 'lucide-react';
import { useState } from 'react';

interface PhotographyService {
  id: number;
  name: string;
  description: string;
  address: string;
  town: string;
  postcode: string;
  price: string;
  rating: string;
  reviewCount: number;
  contactPhone: string;
  contactEmail: string;
  website: string;
  category: string;
  specialties: string[];
}

export default function PhotographyKeepsakesPage() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/classes/search', { category: 'Photography & Keepsakes', postcode: searchLocation || 'London' }],
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger new search
  };

  const categories = [
    { id: 'all', name: 'All Services', icon: '📸' },
    { id: 'newborn', name: 'Newborn Photography', icon: '👶' },
    { id: 'family', name: 'Family Portraits', icon: '👨‍👩‍👧‍👦' },
    { id: 'milestone', name: 'Milestone Photos', icon: '🎂' },
    { id: 'keepsakes', name: 'Keepsakes & Crafts', icon: '🎁' },
    { id: 'cake-smash', name: 'Cake Smash', icon: '🧁' },
    { id: 'maternity', name: 'Maternity', icon: '🤱' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Photography & Keepsakes
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pink-100">
              Capture precious moments and create lasting memories with professional family photographers and keepsake services
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
                  Find Services
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
              Photography & Keepsake Services
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                    selectedCategory === category.id 
                      ? 'bg-pink-100 text-pink-800 ring-2 ring-pink-500' 
                      : 'bg-white dark:bg-gray-800 hover:shadow-md'
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="font-semibold text-xs">{category.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Services */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Featured Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Newborn Photography
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-pink-100">Professional newborn photo sessions capturing those precious first moments.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Family Portraits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-100">Beautiful family portrait sessions celebrating your growing family.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500 to-pink-500 text-white border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Keepsakes & Crafts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-rose-100">Custom keepsakes, hand and footprint crafts, and personalized memory items.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Photography Services Near You
              </h2>
              <Badge variant="secondary" className="text-sm">
                {(services as PhotographyService[]).length} services found
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
            ) : (services as PhotographyService[]).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(services as PhotographyService[]).map((service: PhotographyService) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-pink-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-gray-800 dark:text-white">
                          {service.name}
                        </CardTitle>
                        {service.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">{service.rating}</span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        {service.town}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                        {service.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Camera className="w-3 h-3 mr-1" />
                          Photography
                        </Badge>
                        {service.price && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            {service.price}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {service.contactPhone && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Call
                            </Button>
                          )}
                          {service.contactEmail && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </Button>
                          )}
                          {service.website && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Portfolio
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
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No photography services found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try searching for a different location or check back soon for new services.
                </p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6 text-pink-500" />
                Photography Sessions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Newborn Photography</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Capture your baby's first days with professional newborn portraits.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Milestone Sessions</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Document important milestones like first birthdays and cake smash sessions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Family Portraits</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Beautiful family photos to treasure for years to come.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Gift className="w-6 h-6 text-purple-500" />
                Keepsake Services
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Hand & Footprint Crafts</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Preserve tiny hands and feet in beautiful keepsake crafts.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Memory Books</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Custom photo books and scrapbooks to document your child's journey.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Personalized Gifts</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Unique, personalized keepsakes and gifts for special occasions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}