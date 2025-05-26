import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Heart, Baby, Utensils } from "lucide-react";
import { Link } from "wouter";

export default function BlogWeaningGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage-light">
      <Header />
      
      {/* Article Header */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="outline" className="mb-6 text-white border-white hover:bg-white hover:text-teal-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-teal-100 mb-4">
            <Calendar className="w-4 h-4" />
            May 25, 2025
            <Clock className="w-4 h-4 ml-4" />
            8 min read
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
            Weaning Your Baby: A Science-Backed Guide for First-Time Parents
          </h1>
          
          <p className="text-xl text-teal-100 leading-relaxed">
            The gradual transition from milk to solid food is one of your baby's biggest milestones. 
            Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make 
            this journey rewarding for both you and your little one.
          </p>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <Card className="mb-8 border-l-4 border-teal-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Baby className="w-6 h-6 text-teal-600" />
                  <h2 className="text-2xl font-bold text-teal-dark mb-0">Introduction</h2>
                </div>
                <p className="text-sage text-lg">
                  Weaning marks a significant milestone in your baby's development, typically beginning around 
                  6 months of age. This comprehensive guide combines the latest scientific research with practical 
                  advice to help you navigate this exciting journey with confidence.
                </p>
              </CardContent>
            </Card>

            {/* When to Start */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6 flex items-center gap-3">
                <Clock className="w-8 h-8 text-coral" />
                When to Start Weaning
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                The World Health Organization and UK Department of Health recommend starting weaning at around 
                6 months, when your baby shows these key signs of readiness:
              </p>
              
              <div className="bg-sage-50 p-6 rounded-lg mb-6">
                <ul className="space-y-3 text-sage">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Can sit up with support:</strong> Your baby can hold their head steady and sit upright with minimal assistance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Shows interest in food:</strong> Reaches for food, watches you eat, or opens their mouth when food approaches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Lost the tongue-thrust reflex:</strong> No longer automatically pushes food out with their tongue</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span><strong>Can coordinate chewing motions:</strong> Shows chewing movements even without teeth</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Traditional vs Baby-Led Weaning */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6 flex items-center gap-3">
                <Utensils className="w-8 h-8 text-coral" />
                Weaning Approaches: Traditional vs Baby-Led
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="border-2 border-teal-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-teal-dark mb-4">Traditional Weaning</h3>
                    <p className="text-sage mb-4">
                      Starts with smooth purees and gradually introduces textures. Parents control 
                      the feeding process using spoons.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-sage"><strong>Pros:</strong> More control over intake, easier to track nutrition</p>
                      <p className="text-sm text-sage"><strong>Best for:</strong> Parents who prefer structure and monitoring</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-sage-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-teal-dark mb-4">Baby-Led Weaning</h3>
                    <p className="text-sage mb-4">
                      Babies self-feed with finger foods from the start, exploring textures 
                      and flavors independently.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-sage"><strong>Pros:</strong> Develops motor skills, encourages self-regulation</p>
                      <p className="text-sm text-sage"><strong>Best for:</strong> Families wanting baby to lead the process</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-teal-50 border-l-4 border-teal-400 p-4">
                <p className="text-teal-700">
                  <strong>Expert Tip:</strong> Many families successfully combine both approaches. 
                  You might offer purees at breakfast and finger foods at lunch, adapting to your baby's preferences and your lifestyle.
                </p>
              </div>
            </div>

            {/* Essential Nutrients */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">Essential Nutrients for Growing Babies</h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                During the first year, your baby needs specific nutrients to support rapid growth and development:
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-orange-800 mb-2">Iron</h4>
                    <p className="text-sm text-orange-700">Critical for brain development. Found in meat, lentils, fortified cereals.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-blue-800 mb-2">Healthy Fats</h4>
                    <p className="text-sm text-blue-700">Support brain and eye development. Include avocado, olive oil, fatty fish.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-green-800 mb-2">Vitamin D</h4>
                    <p className="text-sm text-green-700">Essential for bone health. Continue supplements as recommended by your GP.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Meal Prep Tips */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">Time-Saving Meal Prep Strategies</h2>
              
              <div className="bg-coral-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-coral-800 mb-4">Weekly Prep Ideas</h3>
                <ul className="space-y-3 text-coral-700">
                  <li className="flex items-start gap-3">
                    <Heart className="w-5 h-5 mt-0.5 text-coral-600" />
                    <span><strong>Batch cook purees:</strong> Make large batches and freeze in ice cube trays for easy portions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Heart className="w-5 h-5 mt-0.5 text-coral-600" />
                    <span><strong>Pre-cut finger foods:</strong> Prepare steamed vegetables and soft fruits in advance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Heart className="w-5 h-5 mt-0.5 text-coral-600" />
                    <span><strong>Family meals adaptation:</strong> Cook one meal and adapt portions for baby</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Eco-Friendly Tips */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">Sustainable Weaning Practices</h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                Make weaning better for your baby and the planet with these eco-friendly approaches:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sage-800">Reduce Waste</h4>
                  <ul className="space-y-2 text-sage">
                    <li>• Use reusable pouches instead of single-use packets</li>
                    <li>• Make homemade purees to avoid packaging</li>
                    <li>• Compost food scraps</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-bold text-sage-800">Choose Sustainable Options</h4>
                  <ul className="space-y-2 text-sage">
                    <li>• Buy organic when possible for the "Dirty Dozen"</li>
                    <li>• Choose local, seasonal produce</li>
                    <li>• Use bamboo or stainless steel feeding equipment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <Card className="bg-gradient-to-r from-teal-50 to-sage-50 border-2 border-teal-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-teal-dark mb-4">Remember: Every Baby is Different</h2>
                <p className="text-lg text-sage leading-relaxed">
                  Weaning is a journey, not a race. Some babies take to solids immediately, while others need more time 
                  and encouragement. Trust your instincts, follow your baby's cues, and don't hesitate to consult your 
                  health visitor or GP if you have concerns. Most importantly, try to enjoy this exciting milestone in 
                  your baby's development!
                </p>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <Card className="bg-coral-50 border-coral-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-coral-800 mb-4">Need More Parenting Support?</h3>
                  <p className="text-coral-700 mb-6">
                    Join our newsletter for weekly tips, local class recommendations, and expert advice 
                    delivered straight to your inbox.
                  </p>
                  <Button className="bg-coral hover:bg-coral/90 text-white">
                    Subscribe to Newsletter
                  </Button>
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