import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Map, Satellite, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Class } from "@shared/schema";

interface CoverageMapProps {
  classes: Class[];
  fullScreen?: boolean;
}

interface ClusterData {
  count: number;
  lat: number;
  lng: number;
  classes: Class[];
  town: string;
}

export default function CoverageMap({ classes, fullScreen = false }: CoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [clusteredData, setClusteredData] = useState<{[key: string]: ClusterData}>({});

  // Cluster classes by town for clean coverage visualization
  useEffect(() => {
    if (!classes.length) return;

    const clusters: {[key: string]: ClusterData} = {};
    
    classes.forEach(classItem => {
      if (!classItem.latitude || !classItem.longitude || !classItem.town) return;
      
      const lat = parseFloat(classItem.latitude);
      const lng = parseFloat(classItem.longitude);
      const town = classItem.town.toLowerCase();
      
      if (!clusters[town]) {
        clusters[town] = {
          count: 0,
          lat: lat,
          lng: lng,
          classes: [],
          town: classItem.town
        };
      }
      
      clusters[town].count++;
      clusters[town].classes.push(classItem);
      
      // Update cluster center to average position
      const totalLat = clusters[town].classes.reduce((sum, c) => sum + parseFloat(c.latitude!), 0);
      const totalLng = clusters[town].classes.reduce((sum, c) => sum + parseFloat(c.longitude!), 0);
      clusters[town].lat = totalLat / clusters[town].classes.length;
      clusters[town].lng = totalLng / clusters[town].classes.length;
    });

    setClusteredData(clusters);
  }, [classes]);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css")
    ]).then(([L]) => {
      // Clear existing map
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // Initialize map with slight delay
      setTimeout(() => {
        if (!mapRef.current) return;

        const map = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true
        });
        
        mapInstance.current = map;

        // Add tile layer based on map type
        const tileLayer = mapType === 'satellite' 
          ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri'
            })
          : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            });
        
        tileLayer.addTo(map);

        // Set default UK view
        const defaultCenter: [number, number] = [54.5, -3];
        const defaultZoom = 6;
        
        if (Object.keys(clusteredData).length > 0) {
          const group = L.featureGroup();
          
          Object.entries(clusteredData).forEach(([, cluster]) => {
            // Color coding based on class count (like WOW World Group)
            const circleColor = cluster.count >= 20 ? '#22c55e' : 
                                cluster.count >= 10 ? '#84cc16' : 
                                cluster.count >= 5 ? '#eab308' : '#f97316';
            
            // Scale circle size based on class density
            const baseRadius = Math.min(Math.max(cluster.count * 1500, 3000), 25000);
            
            const circle = L.circle([cluster.lat, cluster.lng], {
              color: circleColor,
              fillColor: circleColor,
              fillOpacity: 0.25,
              radius: baseRadius,
              weight: 2
            });
            
            // Create numbered marker like WOW example
            const markerHtml = `
              <div style="
                background: ${circleColor}; 
                color: white; 
                border-radius: 50%; 
                width: 32px; 
                height: 32px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: bold;
                font-size: 13px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              ">${cluster.count}</div>
            `;
            
            const numberIcon = L.divIcon({
              html: markerHtml,
              className: 'coverage-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            
            const marker = L.marker([cluster.lat, cluster.lng], { icon: numberIcon });
            
            // Rich popup with class details
            const topClasses = cluster.classes.slice(0, 5);
            const popupContent = `
              <div style="min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937; font-size: 16px;">
                  ${cluster.town} - ${cluster.count} Classes
                </h4>
                <div style="margin-bottom: 8px;">
                  ${topClasses.map(c => `
                    <div style="margin: 4px 0; font-size: 13px; color: #374151; border-left: 3px solid ${circleColor}; padding-left: 8px;">
                      <strong>${c.name || 'Class'}</strong><br>
                      <span style="color: #6b7280; font-size: 12px;">${c.venue || 'Venue'} • ${c.ageGroupMin || 0}-${c.ageGroupMax || 48} years</span>
                    </div>
                  `).join('')}
                  ${cluster.count > 5 ? `
                    <div style="margin: 8px 0; font-size: 12px; color: #6b7280; font-style: italic;">
                      ...and ${cluster.count - 5} more classes
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            
            group.addLayer(circle);
            group.addLayer(marker);
          });
          
          group.addTo(map);
          map.fitBounds(group.getBounds(), { padding: [30, 30] });
        } else {
          map.setView(defaultCenter, defaultZoom);
        }
      }, 150);
    });
  }, [clusteredData, mapType]);

  const zoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  return (
    <div className={`relative ${fullScreen ? 'h-full' : 'h-[400px]'} rounded-lg overflow-hidden shadow-lg bg-white`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map/Satellite Toggle - positioned like WOW example */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white rounded-md shadow-lg overflow-hidden border border-gray-200">
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMapType('roadmap')}
            className={`rounded-none border-0 px-3 py-2 text-sm ${
              mapType === 'roadmap' 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map className="w-4 h-4 mr-1" />
            Map
          </Button>
          <Button
            variant={mapType === 'satellite' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMapType('satellite')}
            className={`rounded-none border-0 px-3 py-2 text-sm ${
              mapType === 'satellite' 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Satellite className="w-4 h-4 mr-1" />
            Satellite
          </Button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-[1000]">
        <Button
          variant="outline"
          size="sm"
          onClick={zoomIn}
          className="bg-white shadow-md border-gray-300 hover:bg-gray-50 w-8 h-8 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={zoomOut}
          className="bg-white shadow-md border-gray-300 hover:bg-gray-50 w-8 h-8 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {!fullScreen && (
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-gray-300 hover:bg-gray-50 w-8 h-8 p-0"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Coverage Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 z-[1000]">
        <div className="text-sm font-semibold text-gray-800 mb-3">Coverage Areas</div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">20+ classes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-lime-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">10-19 classes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">5-9 classes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-orange-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">1-4 classes</span>
          </div>
        </div>
      </div>
    </div>
  );
}