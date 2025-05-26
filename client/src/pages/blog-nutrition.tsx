import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BlogNutrition() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage-light">
      <Header />
      
      {/* Nutrition Articles Section */}
      <section className="py-16 bg-gradient-to-br from-teal-50 to-sage-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-poppins text-teal-dark mb-4">
              Nutrition Articles
            </h1>
            <p className="text-lg text-sage mb-6">
              Evidence-based nutrition guidance for healthy, happy families
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
              <div className="bg-teal-50 border-l-4 border-teal-400 p-4 mb-6">
                <p className="text-sm text-teal-700">
                  <strong>Key Topics:</strong> When to start weaning, traditional vs baby-led weaning, 
                  essential nutrients, meal prep tips, and avoiding processed foods.
                </p>
              </div>
              <Link href="/blog/weaning-guide">
                <Button className="bg-coral hover:bg-coral/90 text-white w-full">
                  Read Full Article
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}