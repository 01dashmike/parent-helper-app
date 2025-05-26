import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Baby, Search, Gift, Waves, Music, Dumbbell, Brain } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SearchParams } from "@shared/schema";

interface HeroSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export default function HeroSearch({ onSearch, isLoading }: HeroSearchProps) {
  const [postcode, setPostcode] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [dayOfWeek, setDayOfWeek] = useState<string>("all");
  const [radius, setRadius] = useState([5]); // Default 5 miles
  const [priceFilter, setPriceFilter] = useState<string>("all");

  const handleSearch = () => {
    if (!postcode.trim()) return;
    
    onSearch({
      postcode: postcode.trim(),
      ageGroup: ageGroup === "all" ? undefined : ageGroup,
      dayOfWeek: dayOfWeek === "all" ? undefined : dayOfWeek,
      radius: radius[0],
      priceFilter: priceFilter === "all" ? undefined : priceFilter,
      includeInactive: false,
    });
  };

  const handleQuickFilter = (category: string) => {
    if (!postcode.trim()) return;
    
    onSearch({
      postcode: postcode.trim(),
      ageGroup: ageGroup === "all" ? undefined : ageGroup,
      dayOfWeek: dayOfWeek === "all" ? undefined : dayOfWeek,
      category,
      radius: radius[0],
      priceFilter: priceFilter === "all" ? undefined : priceFilter,
      includeInactive: false,
    });
  };

  const getRadiusDescription = (miles: number) => {
    if (miles <= 3) return "Closest town only";
    if (miles <= 7) return "Nearest 2-3 towns";
    if (miles <= 15) return "Wider local area";
    return "Regional search";
  };

  return (
    <section className="bg-gradient-to-br from-coral/10 to-sage/10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-poppins text-teal-dark mb-3">
            Find Classes for Your Little Ones
          </h2>
          <p className="text-lg text-sage mb-6 max-w-2xl mx-auto">
            Discover baby and toddler classes near you - from swimming to music, sensory play to movement!
          </p>
        </div>
        
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline text-coral mr-2" />
                Your Location
              </Label>
              <Input
                type="text"
                placeholder="e.g. Winchester, SO23 9EP, or RG21"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-coral transition-all duration-200"
              />
            </div>
            
            <div className="md:col-span-1">
              <Label className="block text-sm font-semibold text-gray-700 mb-2">
                <Baby className="w-4 h-4 inline text-coral mr-2" />
                Age Group
              </Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-coral transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="0-6">0-6 months</SelectItem>
                  <SelectItem value="6-12">6-12 months</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="2-3">2-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1">
              <Label className="block text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-4 h-4 inline text-coral mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Day of Week
              </Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-coral transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Day</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1 flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={!postcode.trim() || isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Classes
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Radius Slider */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Label className="block text-sm font-semibold text-gray-700 mb-3">
              Search Area: {getRadiusDescription(radius[0])} ({radius[0]} miles)
            </Label>
            <div className="px-3">
              <Slider
                value={radius}
                onValueChange={setRadius}
                max={25}
                min={2}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Closest only</span>
                <span>Wider area</span>
              </div>
            </div>
          </div>
          
          {/* Free/Paid Filter - Enhanced Style */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Label className="block text-sm font-semibold text-gray-700 mb-4">
              Class Type
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPriceFilter("all")}
                className={`relative overflow-hidden rounded-xl py-4 px-6 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center ${
                  priceFilter === "all" 
                    ? "bg-gradient-to-r from-teal-400 to-sage-500 text-white shadow-xl" 
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-teal-300"
                }`}
                style={priceFilter === "all" ? {
                  backgroundImage: `linear-gradient(135deg, rgba(20, 184, 166, 0.9), rgba(132, 204, 22, 0.9)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='30' cy='30' r='8' fill='%23ffffff' opacity='0.2'/%3E%3Ccircle cx='70' cy='70' r='10' fill='%23ffffff' opacity='0.15'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                } : {}}
              >
                <span className="font-semibold text-sm drop-shadow-sm text-center">All Classes</span>
              </button>
              
              <button
                onClick={() => setPriceFilter("free")}
                className={`relative overflow-hidden rounded-xl py-4 px-6 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center ${
                  priceFilter === "free" 
                    ? "bg-gradient-to-r from-coral to-lavender text-white shadow-xl" 
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-coral"
                }`}
                style={priceFilter === "free" ? {
                  backgroundImage: `linear-gradient(135deg, rgba(244, 166, 136, 0.9), rgba(184, 165, 199, 0.9)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 30l15-10v20zM65 25l15 10-15 10z' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23ffffff' opacity='0.2'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                } : {}}
              >
                <span className="font-semibold text-sm drop-shadow-sm text-center">Free Only</span>
              </button>
              
              <button
                onClick={() => setPriceFilter("paid")}
                className={`relative overflow-hidden rounded-xl py-4 px-6 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center ${
                  priceFilter === "paid" 
                    ? "bg-gradient-to-r from-purple-400 to-blue-500 text-white shadow-xl" 
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300"
                }`}
                style={priceFilter === "paid" ? {
                  backgroundImage: `linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(59, 130, 246, 0.9)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='40' cy='40' r='6' fill='%23ffffff' opacity='0.3'/%3E%3Cpath d='M60 20h20v40H60z' fill='%23ffffff' opacity='0.2'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                } : {}}
              >
                <span className="font-semibold text-sm drop-shadow-sm text-center">Paid Only</span>
              </button>
            </div>
          </div>
          
          {/* Category Filters - Happity Style */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-teal-dark mb-4 text-center">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <button
                onClick={() => handleQuickFilter("swimming")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-blue-400 to-blue-600 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.7), rgba(37, 99, 235, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 30c0-5 5-10 15-10s15 5 15 10v20c0 5-5 10-15 10s-15-5-15-10V30zM60 40c0-3 3-6 10-6s10 3 10 6v15c0 3-3 6-10 6s-10-3-10-6V40z' fill='%23ffffff' opacity='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">SWIMMING</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickFilter("music")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-purple-400 to-pink-500 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(147, 51, 234, 0.7), rgba(236, 72, 153, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='30' cy='40' r='8' fill='%23ffffff' opacity='0.4'/%3E%3Ccircle cx='50' cy='30' r='6' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='70' cy='50' r='10' fill='%23ffffff' opacity='0.2'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">MUSIC</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickFilter("sensory")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-green-400 to-emerald-600 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.7), rgba(5, 150, 105, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M30 20h40v20H30zM25 50h50v30H25z' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='40' cy='30' r='3' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='60' cy='30' r='3' fill='%23ffffff' opacity='0.6'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">SENSORY</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickFilter("movement")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-orange-400 to-red-500 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.7), rgba(239, 68, 68, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 20c5 0 10 5 10 10v30c0 5-5 10-10 10s-10-5-10-10V30c0-5 5-10 10-10zM60 40c3 0 6 3 6 6v20c0 3-3 6-6 6s-6-3-6-6V46c0-3 3-6 6-6z' fill='%23ffffff' opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">MOVEMENT</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickFilter("language")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-indigo-400 to-purple-600 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.7), rgba(147, 51, 234, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M25 30h50v8H25zM30 45h40v6H30zM35 58h30v5H35z' fill='%23ffffff' opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">LANGUAGE</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickFilter("art")}
                disabled={!postcode.trim() || isLoading}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 transition-transform duration-300 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(250, 204, 21, 0.7), rgba(251, 146, 60, 0.8)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M30 20l5 30h30l5-30zM20 60h60v20H20z' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='45' cy='35' r='4' fill='%23ffffff' opacity='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg drop-shadow-lg">ART</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
