import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Star, Building, Clock, Baby, Navigation } from "lucide-react";
import { Link } from "wouter";

interface FranchiseStats {
  provider_name: string;
  total_classes: number;
  enhanced_classes: number;
  percentage_enhanced: number;
  towns_covered: number;
  sample_locations: Array<{
    venue: string;
    town: string;
    latitude: number;
    longitude: number;
  }>;
}

export default function FranchiseDirectoryPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const { data: franchiseStats, isLoading } = useQuery({
    queryKey: ["/api/franchise-stats"],
    queryFn: async () => {
      const response = await fetch("/api/franchise-stats");
      if (!response.ok) throw new Error("Failed to fetch franchise stats");
      return response.json();
    },
  });

  const { data: providerClasses, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/franchise-classes", selectedProvider],
    queryFn: async () => {
      if (!selectedProvider) return [];
      const response = await fetch(`/api/franchise-classes?provider=${encodeURIComponent(selectedProvider)}`);
      if (!response.ok) throw new Error("Failed to fetch provider classes");
      return response.json();
    },
    enabled: !!selectedProvider,
  });

  const handleDirections = (latitude: number, longitude: number, venue: string) => {
    const destination = `${latitude},${longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-coral mx-auto mb-4" />
          <p className="text-gray-600">Loading franchise directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-teal-dark mb-2">
                National Franchise Directory
              </h1>
              <p className="text-lg text-gray-600">
                Authentic locations with precise coordinates across the UK
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-coral text-coral hover:bg-coral/10">
                Back to Search
              </Button>
            </Link>
          </div>

          {/* Overall Statistics */}
          {franchiseStats && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Directory Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {franchiseStats.reduce((sum: number, stat: FranchiseStats) => sum + stat.total_classes, 0)}
                  </div>
                  <div className="text-sm text-blue-600">Total Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {franchiseStats.reduce((sum: number, stat: FranchiseStats) => sum + stat.enhanced_classes, 0)}
                  </div>
                  <div className="text-sm text-green-600">With Coordinates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-800">
                    {Math.max(...franchiseStats.map((stat: FranchiseStats) => stat.towns_covered))}
                  </div>
                  <div className="text-sm text-purple-600">Towns Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {franchiseStats.length}
                  </div>
                  <div className="text-sm text-orange-600">Franchise Companies</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Franchise Company Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {franchiseStats?.map((stat: FranchiseStats) => (
            <Card 
              key={stat.provider_name} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedProvider === stat.provider_name ? 'ring-2 ring-coral border-coral' : ''
              }`}
              onClick={() => setSelectedProvider(
                selectedProvider === stat.provider_name ? null : stat.provider_name
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-bold text-teal-dark">
                    {stat.provider_name}
                  </span>
                  <Badge 
                    variant={stat.percentage_enhanced === 100 ? "default" : "secondary"}
                    className={stat.percentage_enhanced === 100 ? "bg-green-500" : ""}
                  >
                    {stat.percentage_enhanced.toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Classes:</span>
                    <span className="font-semibold">{stat.total_classes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">With Coordinates:</span>
                    <span className="font-semibold text-green-600">{stat.enhanced_classes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Towns Covered:</span>
                    <span className="font-semibold text-blue-600">{stat.towns_covered}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-coral to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage_enhanced}%` }}
                    ></div>
                  </div>

                  {/* Sample Locations */}
                  {stat.sample_locations && stat.sample_locations.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Sample Locations:</p>
                      <div className="space-y-1">
                        {stat.sample_locations.slice(0, 3).map((location, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-coral" />
                            {location.venue}, {location.town}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 border-coral text-coral hover:bg-coral/10"
                  >
                    {selectedProvider === stat.provider_name ? 'Hide Classes' : 'View Classes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Provider Classes */}
        {selectedProvider && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-teal-dark">
                {selectedProvider} Locations
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProvider(null)}
                className="border-gray-300"
              >
                Close
              </Button>
            </div>

            {isLoadingClasses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-coral" />
              </div>
            ) : providerClasses && providerClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providerClasses.map((classItem: any) => (
                  <div 
                    key={classItem.id} 
                    className="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {classItem.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {classItem.description?.substring(0, 100)}...
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2 text-coral" />
                          {classItem.venue}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-coral" />
                          {classItem.town}, {classItem.postcode}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Baby className="w-4 h-4 mr-2 text-coral" />
                          {classItem.ageGroupMin}-{classItem.ageGroupMax} months
                        </div>
                        {classItem.dayOfWeek && classItem.time && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-coral" />
                            {classItem.dayOfWeek}s {classItem.time}
                          </div>
                        )}
                      </div>

                      {classItem.latitude && classItem.longitude && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleDirections(
                              classItem.latitude, 
                              classItem.longitude, 
                              classItem.venue
                            )}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Directions
                          </Button>
                          <div className="text-xs text-green-600 flex items-center px-2">
                            <Star className="w-3 h-3 mr-1" />
                            Located
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No classes found for {selectedProvider}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}