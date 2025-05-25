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
      // Only initialize map once
      if (!mapInstance.current) {
        // Calculate map center based on actual class locations
        let mapCenter: [number, number] = [51.1358, -1.3972]; // Default Hampshire center
        let zoomLevel = 11;
        
        if (classes.length > 0) {
          const winchesterClasses = classes.filter(c => c.postcode.startsWith('SO23'));
          const andoverClasses = classes.filter(c => c.postcode.startsWith('SP10'));
          
          if (winchesterClasses.length > 0 && andoverClasses.length === 0) {
            // Only Winchester classes - center on Winchester
            mapCenter = [51.0632, -1.308];
            zoomLevel = 13;
          } else if (andoverClasses.length > 0 && winchesterClasses.length === 0) {
            // Only Andover classes - center on Andover
            mapCenter = [51.2085, -1.4865];
            zoomLevel = 13;
          }
          // If both areas have classes, keep the broader Hampshire view
        }

        const map = L.map(mapRef.current!).setView(mapCenter, zoomLevel);
        mapInstance.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
      }

      // Clear existing markers
      if (mapInstance.current) {
        mapInstance.current.eachLayer((layer: any) => {
          if (layer instanceof L.CircleMarker) {
            mapInstance.current.removeLayer(layer);
          }
        });

        // Add markers for each class with orange dots
        classes.forEach((classItem) => {
          // Use known locations based on postcode
          let lat, lng;
          if (classItem.postcode.startsWith('SO23')) {
            // Winchester area
            lat = 51.0632 + (Math.random() - 0.5) * 0.02;
            lng = -1.308 + (Math.random() - 0.5) * 0.02;
          } else if (classItem.postcode.startsWith('SP10')) {
            // Andover area
            lat = 51.2085 + (Math.random() - 0.5) * 0.02;
            lng = -1.4865 + (Math.random() - 0.5) * 0.02;
          } else {
            return; // Skip if no known location
          }

          const marker = L.circleMarker([lat, lng], {
            color: '#ff6b35', // Orange border
            fillColor: '#ff8c42', // Orange fill
            fillOpacity: 0.8,
            radius: 10,
            weight: 3,
          }).addTo(mapInstance.current);

          // Add interactive popup with class details
          const popupContent = `
            <div class="p-3 min-w-[200px]">
              <h4 class="font-bold text-base mb-2 text-gray-900">${classItem.name}</h4>
              <p class="text-sm text-gray-700 mb-2">${classItem.description}</p>
              <p class="text-sm text-gray-600 mb-1"><strong>Venue:</strong> ${classItem.venue}</p>
              <p class="text-sm text-gray-600 mb-1"><strong>Time:</strong> ${classItem.dayOfWeek}s ${classItem.time}</p>
              <p class="text-sm text-gray-600 mb-2"><strong>Age:</strong> ${classItem.ageGroupMin}-${classItem.ageGroupMax > 12 ? Math.floor(classItem.ageGroupMax/12) + ' years' : classItem.ageGroupMax + ' months'}</p>
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold ${
                  !classItem.price || parseFloat(classItem.price) === 0 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }">
                  ${!classItem.price || parseFloat(classItem.price) === 0 ? 'FREE' : `£${classItem.price}`}
                </span>
                <button onclick="window.open('${classItem.website || '#'}', '_blank')" 
                        class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          
          // Make marker clickable
          marker.on('click', function() {
            marker.openPopup();
          });
        });
      }
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
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Class Locations</span>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Click markers for details
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
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Class Locations</span>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Click orange markers for class details
          </div>
        </div>
      </CardContent>
    </Card>
  );
}