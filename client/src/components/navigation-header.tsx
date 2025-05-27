import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Baby, 
  Users, 
  GraduationCap, 
  Camera, 
  Heart, 
  MessageCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function NavigationHeader() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { 
      path: "/", 
      label: "Home", 
      icon: Home,
      description: "Main directory"
    },
    { 
      path: "/baby-toddler-classes", 
      label: "Baby & Toddler Classes", 
      icon: Baby,
      description: "0-5 years"
    },
    { 
      path: "/after-school-clubs", 
      label: "After School Clubs", 
      icon: GraduationCap,
      description: "5+ years"
    },
    { 
      path: "/photography-keepsakes", 
      label: "Photography & Keepsakes", 
      icon: Camera,
      description: "Memories"
    },
    { 
      path: "/additional-needs", 
      label: "Additional Needs", 
      icon: Heart,
      description: "Specialist support",
      isNew: true
    },
    { 
      path: "/parent-support-groups", 
      label: "Parent Support", 
      icon: MessageCircle,
      description: "Community groups",
      isNew: true
    }
  ];

  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 font-bold text-xl text-teal-600 hover:text-teal-700 transition-colors">
                <Baby className="h-8 w-8" />
                Parent Helper
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`relative h-12 px-4 flex flex-col items-center gap-1 ${
                        isActive 
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.isNew && (
                          <Badge className="bg-pink-500 text-white text-xs px-1 py-0 h-4">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 font-bold text-xl text-teal-600">
                <Baby className="h-8 w-8" />
                Parent Helper
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="border-t bg-white">
              <div className="grid grid-cols-2 gap-2 p-4">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = isActivePath(item.path);
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        className={`w-full h-16 flex flex-col items-center gap-1 p-2 ${
                          isActive 
                            ? "bg-teal-100 text-teal-700 border-teal-200" 
                            : ""
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-1">
                          <IconComponent className="h-4 w-4" />
                          {item.isNew && (
                            <Badge className="bg-pink-500 text-white text-xs px-1 py-0 h-4">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight">
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-500">{item.description}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}