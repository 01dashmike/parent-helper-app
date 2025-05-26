import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, Map as MapIcon } from "lucide-react";
import ClassCard from "./class-card";
import InteractiveMap from "./interactive-map";
import CoverageMap from "./coverage-map";
import { findTownByPostcode, getImageSearchTerm } from "@/lib/town-lookup";
import { imageService, type LocationImage } from "@/lib/image-service";
import type { Class, SearchParams } from "@shared/schema";

interface SearchResultsProps {
  results: Class[];
  searchParams: SearchParams | null;
  isLoading: boolean;
}

export default function SearchResults({ results, searchParams, isLoading }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState("popularity");
  const [locationImage, setLocationImage] = useState<LocationImage | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  // Load location data and image when search params change
  useEffect(() => {
    if (searchParams?.postcode) {
      const town = findTownByPostcode(searchParams.postcode);
      if (town) {
        setLocationName(town.name);
        const searchTerm = getImageSearchTerm(town);
        imageService.getLocationImage(searchTerm).then(image => {
          setLocationImage(image || imageService.getDefaultLocationImage(town.name));
        });
      } else {
        setLocationName("Your Area");
        setLocationImage(imageService.getDefaultLocationImage("Your Area"));
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-lg text-gray-600">Searching for classes...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!searchParams || results.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later for new classes.</p>
        </div>
      </section>
    );
  }

  // Group classes by business name (removing session specifics)
  const groupedResults = results.reduce((acc, classItem) => {
    // Extract base business name (remove session specifics like "- Wednesday", "- Thursday (Birth-6m)")
    const baseName = classItem.name
      .replace(/ - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*$/, '')
      .replace(/ \((Birth|6).*\)$/, '');
    
    if (!acc[baseName]) {
      acc[baseName] = {
        ...classItem,
        name: baseName,
        sessions: []
      };
    }
    
    // Add this session to the business
    acc[baseName].sessions.push({
      id: classItem.id,
      day: classItem.dayOfWeek,
      time: classItem.time,
      ageMin: classItem.ageGroupMin,
      ageMax: classItem.ageGroupMax,
      name: classItem.name
    });
    
    return acc;
  }, {} as Record<string, Class & { sessions: Array<{id: number, day: string, time: string, ageMin: number, ageMax: number, name: string}> }>);

  const sortedResults = Object.values(groupedResults).sort((a, b) => {
    // Baby Sensory and Toddler Sense classes ALWAYS first - highest priority
    const aSensory = a.name.toLowerCase().includes('baby sensory') || a.name.toLowerCase().includes('toddler sense');
    const bSensory = b.name.toLowerCase().includes('baby sensory') || b.name.toLowerCase().includes('toddler sense');
    
    if (aSensory !== bSensory) {
      return aSensory ? -1 : 1;
    }
    
    // Then apply user's chosen sorting
    switch (sortBy) {
      case "distance":
        return a.id - b.id;
      case "price":
        const aPrice = parseFloat(a.price || "0");
        const bPrice = parseFloat(b.price || "0");
        return aPrice - bPrice;
      case "rating":
        const aRating = parseFloat(a.rating || "0");
        const bRating = parseFloat(b.rating || "0");
        return bRating - aRating;
      default: // popularity
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        return (b.popularity || 0) - (a.popularity || 0);
    }
  });



  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold font-poppins text-gray-900">
              Classes in <span className="text-coral">{locationName}</span>
            </h3>
            <p className="text-gray-600 mt-1">
              {results.length} classes found within 10 miles
            </p>
          </div>
          
        </div>

        {/* Business Contact Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-sage/10 to-coral/10 border border-sage/20 rounded-lg p-6 text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Run a baby or toddler class?</h4>
            <p className="text-gray-600 mb-4">Get featured on Parent Helper and reach more families in your area.</p>
            <a 
              href="mailto:notification@parenthelper.co.uk?subject=Feature My Business on Parent Helper"
              className="inline-flex items-center bg-coral text-white px-6 py-3 rounded-lg font-medium hover:bg-coral/90 transition-colors"
            >
              Contact Us for Premium Features
            </a>
          </div>
        </div>

        {/* Filters and View Options */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Sort by Popularity</SelectItem>
                <SelectItem value="distance">Sort by Distance</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-coral text-white" : ""}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
                className={viewMode === "map" ? "bg-coral text-white" : ""}
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Location Hero Image */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
          {locationImage ? (
            <div className="relative">
              <img 
                src={locationImage.url}
                alt={locationImage.alt || `${locationName} area overview`}
                className="w-full h-64 object-cover"
              />
              {locationImage.photographer && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Photo by {locationImage.photographer}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-coral/20 to-sky-soft/20 flex items-center justify-center">
              <span className="text-gray-600">Loading location image...</span>
            </div>
          )}
        </div>

        {viewMode === "list" ? (
          /* Main Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Results List */}
            <div className="lg:col-span-2 space-y-6">
              {sortedResults.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>

            {/* Map Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {sortedResults.length} Classes Found
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Interactive map coming soon!<br/>
                    Browse classes in the list view
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Map View */
          <div className="h-[600px] bg-white rounded-lg shadow-md flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {sortedResults.length} Classes in Your Area
              </h3>
              <p className="text-gray-600 mb-6">
                Professional coverage map coming soon!<br/>
                Switch to List view to browse all available classes
              </p>
              <button
                onClick={() => setViewMode('list')}
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
              >
                View Classes List
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
