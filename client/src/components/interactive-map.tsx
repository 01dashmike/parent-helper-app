import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Class } from "@shared/schema";

interface InteractiveMapProps {
  classes: Class[];
  fullScreen?: boolean;
  searchPostcode?: string;
}

export default function InteractiveMap({ classes, fullScreen = false, searchPostcode }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let cleanup = false;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (cleanup) return;

      // Always reinitialize map to prevent glitches
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // Calculate map center based on search postcode, not results
      let mapCenter: [number, number] = [51.1358, -1.3972]; // Default Hampshire center
      let zoomLevel = 12;
      
      if (searchPostcode) {
        const postcode = searchPostcode.toLowerCase().replace(/\s+/g, '');
        
        if (postcode.startsWith('sp10')) {
          // Andover postcode - center on Andover
          mapCenter = [51.2085, -1.4865];
          zoomLevel = 14;
        } else if (postcode.startsWith('so23')) {
          // Winchester postcode - center on Winchester
          mapCenter = [51.0632, -1.308];
          zoomLevel = 14;
        }
        // For other postcodes, keep default center but zoom in slightly
        else {
          zoomLevel = 13;
        }
      }

      try {
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          attributionControl: true
        }).setView(mapCenter, zoomLevel);
        
        if (cleanup) {
          map.remove();
          return;
        }

        mapInstance.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        // Add markers for each class with orange dots
        classes.forEach((classItem) => {
          if (cleanup) return;

          // Use known locations based on postcode
          let lat, lng;
          if (classItem.postcode.startsWith('SO23')) {
            // Winchester area - use consistent positioning
            lat = 51.0632 + (classItem.id * 0.001) % 0.02 - 0.01;
            lng = -1.308 + (classItem.id * 0.0013) % 0.02 - 0.01;
          } else if (classItem.postcode.startsWith('SP10')) {
            // Andover area - use consistent positioning
            lat = 51.2085 + (classItem.id * 0.001) % 0.02 - 0.01;
            lng = -1.4865 + (classItem.id * 0.0013) % 0.02 - 0.01;
          } else {
            return; // Skip if no known location
          }

          const marker = L.circleMarker([lat, lng], {
            color: '#ff6b35',
            fillColor: '#ff8c42',
            fillOpacity: 0.8,
            radius: 10,
            weight: 3,
          }).addTo(map);

          // Add interactive popup
          const popupContent = `
            <div style="padding: 12px; min-width: 200px;">
              <h4 style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1f2937;">${classItem.name}</h4>
              <p style="font-size: 14px; color: #374151; margin-bottom: 8px;">${classItem.description}</p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;"><strong>Venue:</strong> ${classItem.venue}</p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;"><strong>Time:</strong> ${classItem.dayOfWeek}s ${classItem.time}</p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>Age:</strong> ${classItem.ageGroupMin}-${classItem.ageGroupMax > 12 ? Math.floor(classItem.ageGroupMax/12) + ' years' : classItem.ageGroupMax + ' months'}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; font-weight: bold; color: ${
                  !classItem.price || parseFloat(classItem.price) === 0 
                    ? '#059669' 
                    : '#ea580c'
                };">
                  ${!classItem.price || parseFloat(classItem.price) === 0 ? 'FREE' : `£${classItem.price}`}
                </span>
                <button onclick="window.open('${classItem.website || '#'}', '_blank')" 
                        style="background-color: #f97316; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; border: none; cursor: pointer;">
                  View Details
                </button>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
        });
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    });

    return () => {
      cleanup = true;
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
    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden">
      <Card className="h-full">
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
    </div>
  );
}