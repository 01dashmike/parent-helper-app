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
            🥄 Weaning Your Baby: A Science-Backed Guide for First-Time Parents
          </h1>
          
          <p className="text-xl text-teal-100 leading-relaxed">
            Weaning—the gradual transition from milk to solid food—is one of your baby's biggest milestones. 
            It can feel overwhelming, but with a little preparation and the right tools, it can also be one 
            of the most rewarding stages of early parenthood.
          </p>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* When to Start */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6 flex items-center gap-3">
                📆 When Should You Start Weaning?
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                The NHS and World Health Organization recommend starting weaning at <strong>around 6 months</strong>. 
                At this stage, most babies:
              </p>
              
              <div className="bg-sage-50 p-6 rounded-lg mb-6">
                <ul className="space-y-3 text-sage">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span>Can sit up with minimal support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span>Show interest in food</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-coral rounded-full mt-2"></span>
                    <span>Have lost the tongue-thrust reflex</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Weaning Methods */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🍽️ Weaning Methods
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="border-2 border-teal-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-teal-dark mb-4">1. Traditional (Spoon-fed) Weaning</h3>
                    <div className="space-y-2">
                      <p className="text-sage"><span className="text-green-600 font-bold">✅</span> Easy to batch-cook and freeze, good for iron-rich foods.</p>
                      <p className="text-sage"><span className="text-amber-600 font-bold">⚠️</span> Avoid processed jars and pouches.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-sage-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-teal-dark mb-4">2. Baby-Led Weaning (BLW)</h3>
                    <div className="space-y-2">
                      <p className="text-sage"><span className="text-green-600 font-bold">✅</span> Encourages independence and texture exploration.</p>
                      <p className="text-sage"><span className="text-amber-600 font-bold">⚠️</span> Avoid hard foods that can cause choking.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-teal-50 border-l-4 border-teal-400 p-4">
                <p className="text-teal-700">
                  <span className="text-2xl">💡</span> <strong>Most parents combine both methods.</strong>
                </p>
              </div>
            </div>

            {/* What Science Says */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🧠 What the Science Says
              </h2>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <ul className="space-y-3 text-sage">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    <span>Babies need iron-rich foods from 6 months.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    <span>Early exposure to allergens may reduce allergy risk.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    <span>Variety early may reduce picky eating.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Batch Recipes */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🧊 Batch Recipes for Weaning
              </h2>
              
              <p className="text-lg text-sage leading-relaxed mb-6">
                Batch cooking saves time and reduces waste. Try these simple, nutritious options and freeze them in ice cube trays:
              </p>
              
              <div className="bg-coral-50 p-6 rounded-lg mb-6">
                <ul className="space-y-3 text-coral-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🍠</span>
                    <span><strong>Sweet Potato Mash:</strong> Steam, mash with breastmilk/formula, freeze in cubes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🍎</span>
                    <span><strong>Apple & Pear Purée:</strong> Steam until soft, blend together, no added sugar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🥕</span>
                    <span><strong>Lentil & Carrot Purée:</strong> Simmer red lentils with chopped carrot and a pinch of cumin</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🥦</span>
                    <span><strong>Broccoli & Pea Mash:</strong> Steam and blend with a little olive oil for healthy fats</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-sage">
                Pro tip: use <a href="https://amzn.to/43CW523" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">silicone ice cube trays</a> and label your freezer bags with <a href="https://amzn.to/44PbqPf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">chalkboard labels</a>. Use a <a href="https://amzn.to/3ZAKm2B" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Magic Bullet Blender</a> for batch prep.
              </p>
            </div>

            {/* Eco-Friendly Tips */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🌱 Eco-Friendly Weaning Tips
              </h2>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <ul className="space-y-3 text-green-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎋</span>
                    <span>Use <a href="https://amzn.to/3Snrctd" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">bamboo suction plates</a> and <a href="https://amzn.to/44PbqPf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">silicone bibs</a></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🚫</span>
                    <span>Avoid single-use plastic pouches—try <a href="https://amzn.to/4myFVPJ" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">reusable food pouches</a></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📄</span>
                    <span>Choose organic where possible—start with the Dirty Dozen (download below)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Weaning Essentials Showcase */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                🛒 Weaning Essentials
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/3ZAKm2B" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Magic Bullet Blender</a></strong> – perfect for purées and batch cooking
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/43CW523" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Silicone Ice Cube Trays</a></strong> – ideal for freezing small portions of baby food
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/44PbqPf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Chalkboard Labels</a></strong> – easy way to date and label freezer food
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/4myFVPJ" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Reusable Food Pouches</a></strong> – eco-friendly and handy for meals on-the-go
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/3Snrctd" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Bamboo Suction Plate</a></strong> – mess-free, baby-safe, and sustainable
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">•</span>
                    <div>
                      <strong><a href="https://amzn.to/44PbqPf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Silicone Bibs</a></strong> – soft, wipeable, and built to catch spills
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Tip */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                📱 App Tip: Try Yuka
              </h2>
              
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
                <p className="text-purple-700">
                  <a href="https://yuka.io/en/" target="_blank" className="text-blue-600 underline hover:text-blue-800 font-bold">Yuka</a> is a free mobile app that scans barcodes to rate food and cosmetic health scores. It's perfect for checking toddler snacks or baby food ingredients.
                </p>
              </div>
            </div>

            {/* Why Avoid Processed Food */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                ❌ Why Avoid Processed Baby Food
              </h2>
              
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                <p className="text-red-700">
                  Shop-bought baby foods often contain fruit-heavy purees, low protein/fat, and hidden sugars. A 2020 study by First Steps Nutrition Trust showed many lack the nutritional variety babies need.
                </p>
              </div>
            </div>

            {/* Freebies */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                📥 Freebies
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">🥬</div>
                    <h3 className="text-xl font-bold text-green-800 mb-3">Dirty Dozen & Clean Fifteen Poster</h3>
                    <p className="text-green-700 mb-4">Know which fruits and vegetables to buy organic and which are safe conventional.</p>
                    <a 
                      href="data:text/plain;base64,RGlydHkgRG96ZW4gYW5kIENsZWFuIEZpZnRlZW4gKDIwMjQpCkRpcnR5IERvemVuIC0gQnV5IE9yZ2FuaWMgSWYgUG9zc2libGUKCjEuIFN0cmF3YmVycmllcwoyLiBTcGluYWNoCjMuIEthbGUKNC4gR3JhcGVzCjUuIFBlYWNoZXMKNi4gUGVhcnMKNy4gTmVjdGFyaW5lcwo4LiBBcHBsZXMKOS4gQmVsbCBQZXBwZXJzCjEwLiBDaGVycmllcwoxMS4gQmx1ZWJlcnJpZXMKMTIuIEdyZWVuIEJlYW5zCgpDbGVhbiBGaWZ0ZWVuIC0gTG93ZXN0IGluIFBlc3RpY2lkZXMKCjEuIEF2b2NhZG9zCjIuIFN3ZWV0IENvcm4KMy4gUGluZWFwcGxlCjQuIE9uaW9ucwo1LiBQYXBheWEKNi4gRnJvemVuIFN3ZWV0IFBlYXMKNy4gQXNwYXJhZ3VzCjguIEhvbmV5ZGV3IE1lbG9uCjkuIEtpd2kKMTAuIENhYmJhZ2UKMTEuIE11c2hyb29tcwoxMi4gTWFuZ29lcwoxMy4gV2F0ZXJtZWxvbgoxNC4gQ2Fycm90cwoxNS4gU3dlZXQgUG90YXRvZXM="
                      download="dirty_dozen_clean_fifteen_poster.txt"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      <span className="text-xl">📥</span>
                      Download PDF
                    </a>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-purple-800 mb-3">Weekly Weaning Meal Planner</h3>
                    <p className="text-purple-700 mb-4">Plan your baby's meals, track batch cooking, and monitor nutritional variety.</p>
                    <a 
                      href="data:text/plain;base64,V2Vla2x5IFdlYW5pbmcgTWVhbCBQbGFubmVyCk1lYWwgUGxhbiAoQU0vUE0pCgpNb25kYXkgLSBBTTogX19fX19fX19fXyBQTTogX19fX19fX19fXwpUdWVzZGF5IC0gQU06IF9fX19fX19fX18gUE06IF9fX19fX19fX18KV2VkbmVzZGF5IC0gQU06IF9fX19fX19fX18gUE06IF9fX19fX19fX18KVGh1cnNkYXkgLSBBTTogX19fX19fX19fXyBQTTogX19fX19fX19fXwpGcmlkYXkgLSBBTTogX19fX19fX19fXyBQTTogX19fX19fX19fXwpTYXR1cmRheSAtIEFNOiBfX19fX19fX19fIFBNOiBfX19fX19fX19fClN1bmRheSAtIEFNOiBfX19fX19fX19fIFBNOiBfX19fX19fX19fCgoKRnJlZXplciBCYXRjaCBUcmFja2VyCgpGb29kOiBfX19fX19fX19fX19fXyBEYXRlOiBfX19fX19fIFF0eSBMZWZ0OiBfX19fX19fCl9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXwpfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18KX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fCl9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXwpfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18KCk51dHJpZW50IENoZWNrbGlzdAoKWyBdIElyb24tcmljaCBmb29kIFsgXSBOZXcgZmxhdm91ciBbIF0gQWxsZXJnZW4gdHJpZWQgWyBdIFBvb3AgY2hlY2s="
                      download="weekly_weaning_meal_planner.txt"
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      <span className="text-xl">📥</span>
                      Download PDF
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Affiliate Note */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-teal-dark mb-6">
                💷 Affiliate Note
              </h2>
              
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                <p className="text-yellow-800">
                  Some links in this post may be affiliate links. If you click and buy, we may earn a small commission at no extra cost to you. Thank you for supporting our eco-conscious parenting content!
                </p>
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