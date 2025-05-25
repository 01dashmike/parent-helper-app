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
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // Clear existing map instance if it exists
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // Initialize fresh map with proper scroll handling
      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false, // Prevent scroll wheel zoom conflicts
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true
      });
      
      mapInstance.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Clear existing markers array
      markersRef.current = [];

      // Set map center based on search postcode
      let mapCenter: [number, number] = [51.1358, -1.3972];
      let zoomLevel = 12;
      
      if (searchPostcode) {
        const postcode = searchPostcode.toLowerCase().replace(/\s+/g, '');
        if (postcode.startsWith('sp10')) {
          mapCenter = [51.2085, -1.4865]; // Andover
          zoomLevel = 14;
        } else if (postcode.startsWith('so23')) {
          mapCenter = [51.0632, -1.308]; // Winchester
          zoomLevel = 14;
        }
      }

      // Set map view with a small delay to ensure proper rendering
      setTimeout(() => {
        mapInstance.current.setView(mapCenter, zoomLevel);
        mapInstance.current.invalidateSize();
      }, 100);

      // Add markers for classes
      classes.forEach((classItem, index) => {
        let lat, lng;
        
        // Use predefined coordinates for better accuracy
        if (classItem.postcode.startsWith('SO23')) {
          // Winchester area coordinates
          lat = 51.0632 + (index * 0.003) - 0.006;
          lng = -1.308 + (index * 0.002) - 0.004;
        } else if (classItem.postcode.startsWith('SP10')) {
          // Andover area coordinates  
          lat = 51.2085 + (index * 0.003) - 0.006;
          lng = -1.4865 + (index * 0.002) - 0.004;
        } else {
          return;
        }

        const marker = L.circleMarker([lat, lng], {
          color: '#ff6b35',
          fillColor: '#ff8c42',
          fillOpacity: 0.8,
          radius: 8,
          weight: 2,
        }).addTo(map);

        // Store marker reference
        markersRef.current.push(marker);

        // Add popup with class details
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
    });

    return () => {
      // Clean up markers but keep map instance
      markersRef.current.forEach(marker => {
        if (mapInstance.current) {
          mapInstance.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
    };
  }, [classes, searchPostcode]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  if (fullScreen) {
    return (
      <div className="h-full w-full relative">
        <div ref={mapRef} className="h-full w-full rounded-xl" />
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-sm z-[1000]">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Class Locations</span>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Click markers for details<br/>
            🔒 = Click to enable scroll zoom
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-bold font-poppins text-gray-900">
            <MapPin className="w-5 h-5 text-coral mr-2" />
            Class Locations
          </CardTitle>
          <p className="text-sm text-gray-600">Click orange markers for class details</p>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-80 rounded-lg border" />
        </CardContent>
      </Card>
    </div>
  );
}