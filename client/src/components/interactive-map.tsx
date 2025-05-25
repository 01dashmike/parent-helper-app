import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Class } from "@shared/schema";

interface InteractiveMapProps {
  classes: Class[];
  fullScreen?: boolean;
}

export default function InteractiveMap({ classes, fullScreen = false }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      // Initialize map centered on Camden, London
      const map = L.map(mapRef.current!).setView([51.5431, -0.1503], 13);
      mapInstance.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add markers for each class
      classes.forEach((classItem) => {
        if (classItem.latitude && classItem.longitude) {
          const lat = parseFloat(classItem.latitude);
          const lng = parseFloat(classItem.longitude);
          
          // Determine marker color based on class type
          let color = '#28A745'; // Green for free classes
          if (classItem.isFeatured) {
            color = '#FFD700'; // Gold for featured
          } else if (classItem.price && parseFloat(classItem.price) > 0) {
            color = '#FFC107'; // Yellow for paid
          }

          const marker = L.circleMarker([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 8,
            weight: 2,
          }).addTo(map);

          // Add popup with class information
          const popupContent = `
            <div class="p-2">
              <h4 class="font-bold text-sm mb-1">${classItem.name}</h4>
              <p class="text-xs text-gray-600 mb-1">${classItem.venue}</p>
              <p class="text-xs font-semibold ${
                !classItem.price || parseFloat(classItem.price) === 0 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }">
                ${!classItem.price || parseFloat(classItem.price) === 0 ? 'FREE' : `£${classItem.price}`}
              </p>
            </div>
          `;
          
          marker.bindPopup(popupContent);
        }
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [classes]);

  if (fullScreen) {
    return (
      <div className="h-full w-full relative">
        <div ref={mapRef} className="h-full w-full rounded-xl" />
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-sm z-[1000]">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Free Classes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Paid Classes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gold-soft rounded-full mr-2"></div>
            <span>Featured Classes</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-bold font-poppins text-gray-900">
          <MapPin className="w-5 h-5 text-coral mr-2" />
          Class Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-96 rounded-xl mb-4" />
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Free Classes</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Paid Classes</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-gold-soft rounded-full mr-2"></div>
            <span>Featured Classes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
