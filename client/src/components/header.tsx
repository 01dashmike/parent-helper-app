import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import parentHelperLogo from "@assets/image_1748252869136.png";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/baby-toddler-classes", label: "BABY & TODDLER CLASSES" },
    { href: "/after-school-clubs", label: "AFTER SCHOOL CLUBS" },
    { href: "/family-services", label: "PHOTOGRAPHY & KEEPSAKES" },
    { href: "/blog", label: "BLOG" },
    { href: "/about", label: "ABOUT" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <img 
                src={parentHelperLogo} 
                alt="Parent Helper Logo" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-teal-600">Parent Helper</h1>
                <p className="text-xs text-gray-500 -mt-1">Find Local Classes</p>
              </div>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-gray-700 hover:text-teal-600 transition-colors tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Add Class Button */}
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Link href="/list-class" className="text-white">
              ADD ACTIVITY
            </Link>
          </Button>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-500" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors duration-200 ${
                        isActivePath(item.href)
                          ? "text-coral"
                          : "text-teal-dark hover:text-coral"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
