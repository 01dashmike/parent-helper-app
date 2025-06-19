import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Baby, Music, Palette, Heart, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  description: string;
}

const categories: Category[] = [
  {
    id: 'baby-toddler',
    name: 'Baby & Toddler Classes',
    icon: <Baby className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-pink-400 to-pink-600',
    count: 2847,
    description: 'Swimming, sensory, music & movement'
  },
  {
    id: 'music-movement',
    name: 'Music & Movement',
    icon: <Music className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-purple-400 to-purple-600',
    count: 1243,
    description: 'Singing, dancing & rhythm classes'
  },
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    icon: <Palette className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-orange-400 to-orange-600',
    count: 892,
    description: 'Creative workshops & art sessions'
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: <Heart className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-green-400 to-green-600',
    count: 567,
    description: 'Yoga, fitness & mindfulness'
  },
  {
    id: 'support-groups',
    name: 'Parent Support',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-blue-400 to-blue-600',
    count: 423,
    description: 'Meetups, advice & community'
  },
  {
    id: 'after-school',
    name: 'After School Clubs',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    count: 1085,
    description: 'Sports, homework help & activities'
  }
];

interface ScrollingCategoriesProps {
  onCategorySelect?: (categoryId: string) => void;
}

export function ScrollingCategories({ onCategorySelect }: ScrollingCategoriesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <div className="relative w-full">
      {/* Scroll Controls */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border shadow-lg transition-all duration-200 ${
            canScrollLeft 
              ? 'opacity-100 hover:scale-110' 
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border shadow-lg transition-all duration-200 ${
            canScrollRight 
              ? 'opacity-100 hover:scale-110' 
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrolling Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide gap-4 pb-2 px-8"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`group flex-shrink-0 relative cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedCategory === category.id ? 'scale-105' : ''
            }`}
            onClick={() => handleCategoryClick(category.id)}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Category Card */}
            <div className={`
              relative overflow-hidden rounded-2xl w-64 h-32 ${category.color}
              shadow-lg hover:shadow-xl transition-all duration-300
              ${selectedCategory === category.id ? 'ring-4 ring-white/50' : ''}
            `}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20" />
                <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/20" />
              </div>

              {/* Content */}
              <div className="relative p-4 h-full flex flex-col justify-between text-white">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {category.icon}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-white/30 text-xs font-medium"
                  >
                    {category.count.toLocaleString()}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm opacity-90 font-medium">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Selection Indicator */}
            {selectedCategory === category.id && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg animate-bounce" />
            )}
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white to-transparent pointer-events-none" />
    </div>
  );
}