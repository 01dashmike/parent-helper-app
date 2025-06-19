import { useState } from "react";
import { Search, MapPin, Clock, Users, Phone, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchClasses } from "@/lib/database-client";

interface Class {
  id: number;
  name: string;
  description: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price: string | null;
  venue: string;
  address: string;
  postcode: string;
  town: string;
  dayOfWeek: string;
  time: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  category: string;
  rating?: string;
  reviewCount?: number;
}

export function ClassSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");

    try {
      const classes = await searchClasses({
        postcode: searchTerm,
        radius: 15
      });
      setResults(classes);
    } catch (err) {
      setError("Failed to search classes. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatAgeRange = (min: number, max: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months}m`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) return `${years}y`;
      return `${years}y ${remainingMonths}m`;
    };

    return `${formatAge(min)} - ${formatAge(max)}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Find Baby & Toddler Classes
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Discover amazing classes and activities near you
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Enter your town or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Found {results.length} classes
          </h2>
          
          <div className="grid gap-4">
            {results.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.venue} • {classItem.town}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {classItem.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    {classItem.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Ages {formatAgeRange(classItem.ageGroupMin, classItem.ageGroupMax)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{classItem.dayOfWeek}s {classItem.time}</span>
                    </div>
                    
                    {classItem.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          £{classItem.price}
                        </span>
                      </div>
                    )}
                    
                    {classItem.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{classItem.rating}</span>
                        {classItem.reviewCount && (
                          <span className="text-gray-500">({classItem.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.address}, {classItem.postcode}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {classItem.contactPhone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${classItem.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </a>
                        </Button>
                      )}
                      
                      {classItem.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={classItem.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                      
                      {classItem.contactEmail && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${classItem.contactEmail}`}>
                            Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            No classes found for "{searchTerm}". Try searching for a different location.
          </p>
        </div>
      )}
    </div>
  );
}