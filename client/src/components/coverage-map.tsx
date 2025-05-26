import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Map, Satellite, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Class } from "@shared/schema";

interface CoverageMapProps {
  classes: Class[];
  fullScreen?: boolean;
  searchPostcode?: string;
}

export default function CoverageMap({ classes, fullScreen = false, searchPostcode }: CoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [clusteredData, setClusteredData] = useState<{[key: string]: {count: number, lat: number, lng: number, classes: Class[]}}>({});

  // Cluster classes by geographic proximity
  useEffect(() => {
    if (!classes.length) return;

    const clusters: {[key: string]: {count: number, lat: number, lng: number, classes: Class[]}} = {};
    
    classes.forEach(classItem => {
      if (!classItem.latitude || !classItem.longitude) return;
      
      const lat = parseFloat(classItem.latitude);
      const lng = parseFloat(classItem.longitude);
      
      // Round coordinates to create geographic clusters (adjust precision for clustering level)
      const clusterKey = `${Math.round(lat * 20) / 20}_${Math.round(lng * 20) / 20}`;
      
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = {
          count: 0,
          lat: lat,
          lng: lng,
          classes: []
        };
      }
      
      clusters[clusterKey].count++;
      clusters[clusterKey].classes.push(classItem);
      // Update cluster center to average position
      clusters[clusterKey].lat = clusters[clusterKey].classes.reduce((sum, c) => sum + parseFloat(c.latitude!), 0) / clusters[clusterKey].classes.length;
      clusters[clusterKey].lng = clusters[clusterKey].classes.reduce((sum, c) => sum + parseFloat(c.longitude!), 0) / clusters[clusterKey].classes.length;
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

      // Initialize map
      const map = L.map(mapRef.current!, {
        zoomControl: false, // We'll add custom controls
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });
      
      mapInstance.current = map;

      // Add appropriate tile layer based on map type
      const tileLayer = mapType === 'satellite' 
        ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
          })
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          });
      
      tileLayer.addTo(map);

      // Set initial view - UK coverage
      const defaultCenter: [number, number] = [54.5, -3]; // Center of UK
      const defaultZoom = 6;
      
      if (Object.keys(clusteredData).length > 0) {
        // If we have data, fit to bounds
        const group = L.featureGroup();
        
        Object.entries(clusteredData).forEach(([key, cluster]) => {
          // Create coverage circles like WOW World Group
          const circleColor = cluster.count > 20 ? '#22c55e' : 
                              cluster.count > 10 ? '#84cc16' : 
                              cluster.count > 5 ? '#eab308' : '#f97316';
          
          const circleRadius = Math.min(Math.max(cluster.count * 2000, 5000), 50000); // Scale circle size
          
          const circle = L.circle([cluster.lat, cluster.lng], {
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.3,
            radius: circleRadius,
            weight: 2
          });
          
          // Add number overlay like the example
          const numberIcon = L.divIcon({
            html: `<div style="
              background: ${circleColor}; 
              color: white; 
              border-radius: 50%; 
              width: 30px; 
              height: 30px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${cluster.count}</div>`,
            className: 'coverage-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          const marker = L.marker([cluster.lat, cluster.lng], { icon: numberIcon });
          
          // Add popup with class details
          const popupContent = `
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold;">${cluster.count} Classes in this area</h4>
              ${cluster.classes.slice(0, 5).map(c => `<div style="margin: 2px 0; font-size: 13px;">• ${c.name}</div>`).join('')}
              ${cluster.count > 5 ? `<div style="margin: 4px 0; font-size: 12px; color: #666;">...and ${cluster.count - 5} more</div>` : ''}
            </div>
          `;
          
          marker.bindPopup(popupContent);
          
          group.addLayer(circle);
          group.addLayer(marker);
        });
        
        group.addTo(map);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      } else {
        map.setView(defaultCenter, defaultZoom);
      }
    });
  }, [clusteredData, mapType]);

  const toggleMapType = () => {
    setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  };

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
    <div className={`relative ${fullScreen ? 'h-full' : 'h-[400px]'} rounded-lg overflow-hidden shadow-lg`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Controls - positioned like the WOW example */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        {/* Map/Satellite Toggle */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMapType('roadmap')}
            className={`rounded-none border-0 ${mapType === 'roadmap' ? 'bg-coral text-white' : 'text-gray-700'}`}
          >
            <Map className="w-4 h-4 mr-1" />
            Map
          </Button>
          <Button
            variant={mapType === 'satellite' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMapType('satellite')}
            className={`rounded-none border-0 ${mapType === 'satellite' ? 'bg-coral text-white' : 'text-gray-700'}`}
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
          className="bg-white shadow-md border-gray-300 hover:bg-gray-50"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={zoomOut}
          className="bg-white shadow-md border-gray-300 hover:bg-gray-50"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {!fullScreen && (
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-gray-300 hover:bg-gray-50"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Coverage Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Class Coverage</div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>20+ classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500"></div>
            <span>10-19 classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>5-9 classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>1-4 classes</span>
          </div>
        </div>
      </div>
    </div>
  );
}