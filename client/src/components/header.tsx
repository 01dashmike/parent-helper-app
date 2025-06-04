import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Baby, GraduationCap, Camera, Gift, Heart, MessageCircle } from "lucide-react";
import parentHelperLogo from "@assets/image_1748252869136.png";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { 
      href: "/baby-toddler-classes", 
      label: "BABY & TODDLER CLASSES",
      icon: Baby,
      description: "0-5 years"
    },
    { 
      href: "/after-school-clubs", 
      label: "AFTER SCHOOL CLUBS",
      icon: GraduationCap,
      description: "5+ years"
    },
    { 
      href: "/photography-keepsakes", 
      label: "PHOTOGRAPHY & KEEPSAKES",
      icon: Camera,
      description: "Memories"
    },
    { 
      href: "/free-samples", 
      label: "FREE SAMPLES",
      icon: Gift,
      description: "Free baby offers",
      isNew: true
    },
    { 
      href: "/additional-needs", 
      label: "ADDITIONAL NEEDS",
      icon: Heart,
      description: "Specialist support",
      isNew: true
    },
    { 
      href: "/parent-support-groups", 
      label: "PARENT SUPPORT",
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="flex items-center space-x-3">
              <img 
                src={parentHelperLogo} 
                alt="Parent Helper Logo" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-teal-600">Parent Helper</h1>
              </div>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center overflow-hidden">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePath(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`relative h-12 px-2 flex flex-col items-center gap-1 text-xs ${
                      isActive 
                        ? "bg-teal-100 text-teal-700 hover:bg-teal-200" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                      {item.isNew && (
                        <Badge className="bg-pink-500 text-white text-[8px] px-1 py-0 h-3 ml-1">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 leading-none">{item.description}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* Add Class Button - Desktop */}
          <div className="hidden lg:block flex-shrink-0">
            <Button className="bg-teal-600 hover:bg-teal-700 whitespace-nowrap">
              <Link href="/list-class" className="text-white">
                ADD ACTIVITY
              </Link>
            </Button>
          </div>
          
          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-500" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = isActivePath(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? "bg-teal-100 text-teal-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.label}</span>
                            {item.isNew && (
                              <Badge className="bg-pink-500 text-white text-xs px-2 py-0 h-5">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {/* Add Activity Button in Mobile Menu */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Link
                      href="/list-class"
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                        ADD ACTIVITY
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
