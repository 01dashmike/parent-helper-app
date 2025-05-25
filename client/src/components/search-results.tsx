import { useState } from "react";
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
import type { Class, SearchParams } from "@shared/schema";

interface SearchResultsProps {
  results: Class[];
  searchParams: SearchParams | null;
  isLoading: boolean;
}

export default function SearchResults({ results, searchParams, isLoading }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState("popularity");

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

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        // Mock distance sorting - in production this would use actual coordinates
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
        return b.popularity - a.popularity;
    }
  });

  const locationName = "Camden, London"; // In production, this would come from postcode lookup

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
          <img 
            src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&h=400" 
            alt={`${locationName} area overview`}
            className="w-full h-64 object-cover"
          />
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
              <InteractiveMap classes={sortedResults} />
            </div>
          </div>
        ) : (
          /* Full Map View */
          <div className="h-[600px]">
            <InteractiveMap classes={sortedResults} fullScreen />
          </div>
        )}
      </div>
    </section>
  );
}
