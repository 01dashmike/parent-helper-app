import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Check, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-warm-gray">
      <Header />
      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl font-bold font-poppins text-gray-900 mb-6">
                About Parent Helper
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                We're passionate about helping families find the perfect activities for their little ones. Our platform connects parents with high-quality baby and toddler classes across the UK.
              </p>
              <p className="text-gray-600 mb-6">
                Founded by a team of parents who understand the challenges of finding suitable activities for young children, we've curated a comprehensive directory of classes that support early childhood development.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-coral mb-2">500+</div>
                  <div className="text-sm text-gray-600">Classes Listed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-coral mb-2">50+</div>
                  <div className="text-sm text-gray-600">Cities Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-coral mb-2">10k+</div>
                  <div className="text-sm text-gray-600">Happy Families</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-coral mb-2">4.8★</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
              </div>
              
              <Button className="bg-coral hover:bg-coral/90 text-white">
                <Heart className="w-4 h-4 mr-2" />
                Join Our Community
              </Button>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Diverse group of mothers with children playing" 
                className="rounded-2xl shadow-lg w-full"
              />
              
              <Card className="absolute -bottom-4 -left-4 border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Verified Classes</div>
                      <div className="text-sm text-gray-500">Quality assured</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="absolute -top-4 -right-4 border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center mr-3">
                      <MapPin className="w-4 h-4 text-coral" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Local Focus</div>
                      <div className="text-sm text-gray-500">Classes near you</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
