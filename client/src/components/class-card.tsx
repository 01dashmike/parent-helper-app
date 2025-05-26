import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Baby, MapPin, Clock, Star, Building, Star as StarFilled } from "lucide-react";
import { findTownByPostcode } from "@/lib/town-lookup";
import type { Class } from "@shared/schema";
import babySensoryBanner from "@assets/r637772636132920862_45394-WOW-Website-Banners_BS_150dpi_.Djpg.jpg";
import toddlerSenseBanner from "@assets/r637772637007222808_45394-WOW-Website-Banners_TS_150dpi_D.jpg";
import WhatsAppButton from "./whatsapp-button";

interface ClassCardProps {
  classItem: Class;
}

export default function ClassCard({ classItem }: ClassCardProps) {
  const isFree = !classItem.price || parseFloat(classItem.price) === 0;
  const price = isFree ? "FREE" : `£${classItem.price}`;
  
  // Check if this is a Baby Sensory or Toddler Sense class
  const isBabySensory = classItem.name.toLowerCase().includes('baby sensory');
  const isToddlerSense = classItem.name.toLowerCase().includes('toddler sense');
  
  const formatAgeRange = (min: number, max: number) => {
    if (max <= 12) {
      return `${min}-${max} months`;
    }
    const minYears = Math.floor(min / 12);
    const maxYears = Math.floor(max / 12);
    
    if (minYears === 0) {
      return `${min} months - ${maxYears} year${maxYears > 1 ? 's' : ''}`;
    }
    
    return `${minYears}-${maxYears} year${maxYears > 1 ? 's' : ''}`;
  };

  const getClassImage = (category: string) => {
    const imageMap: Record<string, string> = {
      sensory: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
      music: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
      swimming: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
      yoga: "https://images.unsplash.com/photo-1506629905607-ce91decc5a50?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
      movement: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
    };
    
    return imageMap[category] || imageMap.sensory;
  };

  // Check if this is a premium sensory class
  const isPremiumSensory = classItem.name.toLowerCase().includes('baby sensory') || 
                          classItem.name.toLowerCase().includes('toddler sense');

  const cardClasses = isPremiumSensory
    ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6 relative premium-sensory-card shadow-lg"
    : classItem.isFeatured 
    ? "bg-gradient-to-r from-gold-soft/20 to-yellow-100 border-2 border-gold-soft/40 rounded-2xl p-6 relative featured-card"
    : "bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200";

  return (
    <div className={cardClasses}>
      {/* Baby Sensory Banner Image */}
      {isBabySensory && (
        <div className="w-full h-56 mb-4 rounded-t-lg overflow-hidden bg-white">
          <img 
            src={babySensoryBanner} 
            alt="Baby Sensory - Precious Early Learning for Babies" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Toddler Sense Banner Image */}
      {isToddlerSense && (
        <div className="w-full h-56 mb-4 rounded-t-lg overflow-hidden bg-white">
          <img 
            src={toddlerSenseBanner} 
            alt="Toddler Sense - Life's an Adventure" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {classItem.isFeatured && !isPremiumSensory && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-gold-soft text-yellow-900 text-xs font-bold">
            <StarFilled className="w-3 h-3 mr-1" />
            FEATURED
          </Badge>
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-xl font-bold font-poppins text-gray-900 pr-4">
              {classItem.name}
            </h4>
            <div className="flex gap-2">
              {/* Removed duplicate Google Reviews Badge - kept star display below */}
            </div>
          </div>
          
          <p className="text-gray-600 mb-3">
            {classItem.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center">
              <Baby className="w-4 h-4 mr-1 text-coral" />
              {formatAgeRange(classItem.ageGroupMin, classItem.ageGroupMax)}
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-coral" />
              {findTownByPostcode(classItem.postcode)?.name || classItem.postcode}
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-coral" />
              {classItem.dayOfWeek}s {classItem.time}
            </span>
            {classItem.rating && classItem.reviewCount !== null && classItem.reviewCount !== undefined && (
              <span className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarFilled 
                      key={i} 
                      className={`w-3 h-3 ${i < Math.floor(parseFloat(classItem.rating || "0")) ? 'text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="ml-1 text-xs">
                  {classItem.rating} ({classItem.reviewCount})
                </span>
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 flex items-center">
              <Building className="w-4 h-4 mr-1" />
              {classItem.venue}
            </p>
            <div className="flex gap-2">
              <WhatsAppButton 
                classItem={classItem} 
                variant={isPremiumSensory ? "direct" : "concierge"}
              />
              <Button className="bg-coral hover:bg-coral/90 text-white">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
