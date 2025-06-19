import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Heart } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const quickLinks = [
    { href: "/", label: "Find Classes" },
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
    { href: "#", label: "Contact" },
  ];

  const classTypes = [
    { href: "#", label: "Baby Classes" },
    { href: "#", label: "Toddler Classes" },
    { href: "#", label: "Swimming" },
    { href: "#", label: "Music Classes" },
    { href: "#", label: "Movement & Yoga" },
  ];

  const supportLinks = [
    { href: "#", label: "Help Center" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "List Your Class" },
    { href: "#", label: "Partnership" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold font-poppins text-coral mb-4">Parent Helper</h3>
            <p className="text-gray-300 mb-6">
              Connecting families with amazing baby and toddler classes across the UK.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-coral transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-coral transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Class Types</h4>
            <ul className="space-y-2">
              {classTypes.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-coral transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-coral transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Little Steps Directory. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-gray-400 text-sm mr-4">Made with</span>
            <Heart className="w-4 h-4 text-coral" />
            <span className="text-gray-400 text-sm ml-1">for families</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
