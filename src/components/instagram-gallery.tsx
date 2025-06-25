import { Instagram, ExternalLink } from "lucide-react";

interface InstagramGalleryProps {
  instagramHandle: string;
  className?: string;
}

export default function InstagramGallery({ 
  instagramHandle, 
  className = ""
}: InstagramGalleryProps) {
  // For now, we'll display an Instagram link only
  // In the future, we can manually curate specific posts from providers

  if (!instagramHandle) {
    return null;
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
      
      <div className="text-center py-8">
        <p className="text-sm text-gray-600 mb-3">
          Follow @{instagramHandle} to see their latest class photos and updates!
        </p>
        <a 
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
        >
          <Instagram className="w-4 h-4" />
          View on Instagram
        </a>
      </div>
    </div>
  );
}