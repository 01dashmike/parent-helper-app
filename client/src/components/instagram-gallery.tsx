import { useState, useEffect } from "react";
import { InstagramPhoto, instagramService } from "@/lib/instagram-service";
import { Instagram, ExternalLink } from "lucide-react";

interface InstagramGalleryProps {
  instagramHandle: string;
  className?: string;
  maxPhotos?: number;
}

export default function InstagramGallery({ 
  instagramHandle, 
  className = "", 
  maxPhotos = 4 
}: InstagramGalleryProps) {
  const [photos, setPhotos] = useState<InstagramPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!instagramHandle) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const classPhotos = await instagramService.getClassPhotos(instagramHandle);
        setPhotos(classPhotos.slice(0, maxPhotos));
        setError(null);
      } catch (err) {
        setError('Unable to load Instagram photos');
        console.error('Instagram gallery error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [instagramHandle, maxPhotos]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Instagram className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium text-gray-700">Loading photos...</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || photos.length === 0) {
    return null; // Don't show anything if no photos or error
  }

  return (
    <div className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium text-gray-700">
            @{instagramHandle}
          </span>
        </div>
        <a 
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photo.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded aspect-square bg-gray-100"
          >
            <img
              src={photo.media_url}
              alt={photo.caption?.slice(0, 100) || 'Class photo'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            {photo.media_type === 'VIDEO' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-gray-800 border-y-[4px] border-y-transparent ml-1" />
                </div>
              </div>
            )}
          </a>
        ))}
      </div>
      
      {photos.length > 0 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Recent class photos • Click to view on Instagram
        </p>
      )}
    </div>
  );
}