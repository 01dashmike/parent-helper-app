import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  activeFilters: any;
}

export default function AdvancedFilters({ onFiltersChange, activeFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { id: "swimming", label: "Swimming", count: 1200 },
    { id: "music", label: "Music & Singing", count: 890 },
    { id: "sensory", label: "Sensory Play", count: 650 },
    { id: "movement", label: "Movement & Dance", count: 520 },
    { id: "language", label: "Language & Stories", count: 340 },
    { id: "craft", label: "Arts & Crafts", count: 280 },
    { id: "outdoor", label: "Outdoor Activities", count: 210 },
    { id: "yoga", label: "Baby/Parent Yoga", count: 180 }
  ];

  const ageRanges = [
    { id: "newborn", label: "Newborn (0-3 months)", count: 320 },
    { id: "baby", label: "Baby (3-12 months)", count: 1850 },
    { id: "toddler", label: "Toddler (1-3 years)", count: 2100 },
    { id: "preschool", label: "Preschool (3-5 years)", count: 980 }
  ];

  const timeSlots = [
    { id: "morning", label: "Morning (9am-12pm)", count: 2200 },
    { id: "afternoon", label: "Afternoon (12pm-5pm)", count: 1800 },
    { id: "evening", label: "Evening (5pm-8pm)", count: 450 }
  ];

  const features = [
    { id: "parking", label: "Free Parking Available", count: 3200 },
    { id: "buggy", label: "Buggy Friendly", count: 2800 },
    { id: "cafe", label: "Café On-Site", count: 650 },
    { id: "changing", label: "Baby Changing Facilities", count: 4100 },
    { id: "siblings", label: "Siblings Welcome", count: 1900 }
  ];

  const handleFilterToggle = (filterType: string, value: string) => {
    const currentFilters = activeFilters[filterType] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((f: string) => f !== value)
      : [...currentFilters, value];
    
    onFiltersChange({
      ...activeFilters,
      [filterType]: newFilters
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().filter(Boolean).length;
  };

  const FilterSection = ({ title, items, filterType }: { title: string; items: any[]; filterType: string }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <Checkbox
              id={`${filterType}-${item.id}`}
              checked={(activeFilters[filterType] || []).includes(item.id)}
              onCheckedChange={() => handleFilterToggle(filterType, item.id)}
            />
            <Label 
              htmlFor={`${filterType}-${item.id}`} 
              className="flex-1 text-sm text-gray-700 cursor-pointer"
            >
              {item.label}
            </Label>
            <span className="text-xs text-gray-500">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-coral text-white"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-6" align="start">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              {getActiveFilterCount() > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-coral hover:text-coral-dark"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <FilterSection 
              title="Class Type" 
              items={categories} 
              filterType="categories" 
            />
            
            <Separator />
            
            <FilterSection 
              title="Age Range" 
              items={ageRanges} 
              filterType="ageRanges" 
            />
            
            <Separator />
            
            <FilterSection 
              title="Time of Day" 
              items={timeSlots} 
              filterType="timeSlots" 
            />
            
            <Separator />
            
            <FilterSection 
              title="Venue Features" 
              items={features} 
              filterType="features" 
            />

            <div className="pt-4 border-t">
              <Button 
                onClick={() => setIsOpen(false)}
                className="w-full bg-coral hover:bg-coral-dark"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterType, values]) =>
            (values as string[]).map((value) => (
              <Badge 
                key={`${filterType}-${value}`}
                variant="secondary"
                className="bg-coral/10 text-coral border-coral/20"
              >
                {value}
                <button
                  onClick={() => handleFilterToggle(filterType, value)}
                  className="ml-2 hover:bg-coral/20 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}