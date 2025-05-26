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
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins text-teal-dark mb-4">
            Find Amazing Classes for Your Little Ones
          </h2>
          <p className="text-xl text-sage mb-8 max-w-3xl mx-auto">
            Discover baby and toddler classes near you. From sensory play to swimming, music to movement - we've got everything to help your child learn, grow and have fun!
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
                className="w-full bg-coral hover:bg-coral/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
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
          
          {/* Free/Paid Filter */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Label className="block text-sm font-semibold text-gray-700 mb-3">
              Class Type
            </Label>
            <Tabs value={priceFilter} onValueChange={setPriceFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-sm">All Classes</TabsTrigger>
                <TabsTrigger value="free" className="text-sm">Free Only</TabsTrigger>
                <TabsTrigger value="paid" className="text-sm">Paid Only</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Quick Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-sm font-medium text-gray-600">Quick filters:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter("sensory")}
              disabled={!postcode.trim() || isLoading}
              className="px-4 py-2 bg-green-100 text-green-800 border-green-200 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
            >
              <Brain className="w-3 h-3 mr-1" />
              Sensory Classes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter("free")}
              disabled={!postcode.trim() || isLoading}
              className="px-4 py-2 bg-blue-100 text-blue-800 border-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              <Gift className="w-3 h-3 mr-1" />
              Free Classes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter("swimming")}
              disabled={!postcode.trim() || isLoading}
              className="px-4 py-2 bg-sky-100 text-sky-800 border-sky-200 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors"
            >
              <Waves className="w-3 h-3 mr-1" />
              Swimming
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter("music")}
              disabled={!postcode.trim() || isLoading}
              className="px-4 py-2 bg-purple-100 text-purple-800 border-purple-200 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              <Music className="w-3 h-3 mr-1" />
              Music Classes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter("movement")}
              disabled={!postcode.trim() || isLoading}
              className="px-4 py-2 bg-orange-100 text-orange-800 border-orange-200 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
            >
              <Dumbbell className="w-3 h-3 mr-1" />
              Movement
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
