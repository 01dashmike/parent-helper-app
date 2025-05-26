import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BlogBabyToToddler() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage-light">
      <Header />
      
      {/* Baby to Toddler Articles Section */}
      <section className="py-16 bg-gradient-to-br from-lavender-50 to-sage-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-poppins text-teal-dark mb-4">
              Baby to Toddler Articles
            </h1>
            <p className="text-lg text-sage mb-6">
              Navigate the exciting transition from baby to toddler with confidence
            </p>
            <Link href="/blog">
              <Button className="bg-coral hover:bg-coral/90 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to all categories
              </Button>
            </Link>
          </div>
          
          <Card className="max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 text-sm text-sage mb-4">
                <Calendar className="w-4 h-4" />
                May 25, 2025
                <Clock className="w-4 h-4 ml-2" />
                8 min read
              </div>
              <h2 className="text-2xl font-bold font-poppins text-teal-dark mb-4">
                Weaning Your Baby: A Science-Backed Guide for First-Time Parents
              </h2>
              <p className="text-sage leading-relaxed mb-6">
                The gradual transition from milk to solid food is one of your baby's biggest milestones. Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make this journey rewarding for both you and your little one.
              </p>
              <div className="bg-lavender-50 border-l-4 border-purple-400 p-4 mb-6">
                <p className="text-sm text-purple-700">
                  <strong>Perfect for:</strong> Parents transitioning their baby from milk to solids, 
                  covering everything from timing to techniques and nutritional needs.
                </p>
              </div>
              <Button className="bg-coral hover:bg-coral/90 text-white w-full">
                Read Full Article
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}