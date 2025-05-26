import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Check, MapPin, Users, Clock, Lightbulb } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold font-poppins text-teal-dark mb-6">
                Our Story
              </h1>
              <p className="text-lg text-sage mb-6">
                As parents to three young children, we know the daily struggles all too well. Why is our baby crying? What sensory activities help development? Which classes should we try? Where do we go at weekends? What can we do on rainy evenings? How do we get them to eat healthy food they'll actually like? Which car seat is safest? The questions never end.
              </p>
              <p className="text-teal-dark mb-6">
                The endless searching for baby classes, toddler activities, and family-friendly events had become a time-consuming chore. We'd waste precious family time hunting down information that was scattered across dozens of different websites and social media pages.
              </p>
              <p className="text-sage mb-6">
                That's when we realised we could use our passion for technology to solve this frustrating problem - not just for us, but for thousands of other parents facing the same daily challenges across the UK.
              </p>
              
              <div className="bg-gradient-to-r from-coral/10 to-sage/10 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-teal-dark mb-4">
                  <Lightbulb className="w-5 h-5 inline mr-2" />
                  Parent Helper was born
                </h3>
                <p className="text-sage">
                  We started with what we needed most - a comprehensive class directory that saves parents time and connects families with brilliant local activities. But that was just the beginning. We're building a complete parenting ecosystem, your one-stop guide for everything from baby classes to family nutrition. No more endless searching, no more missed opportunities.
                </p>
              </div>
              
              <Button className="bg-coral hover:bg-coral/90 text-white mr-4">
                <Heart className="w-4 h-4 mr-2" />
                Start Exploring Classes
              </Button>
              <Button variant="outline" className="border-sage text-sage hover:bg-sage hover:text-white">
                Our Mission
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

      {/* Growing Beyond Classes Section */}
      <section className="py-16 bg-gradient-to-br from-lavender/20 to-coral/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins text-teal-dark mb-4">
              Growing Beyond Classes
            </h2>
            <p className="text-lg text-sage max-w-3xl mx-auto">
              Our mission is expanding. We're building a comprehensive parent helper ecosystem that addresses all the daily challenges UK families face.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-coral" />
                </div>
                <h3 className="text-xl font-semibold text-teal-dark mb-4">Food & Nutrition</h3>
                <p className="text-sage">
                  Helping parents navigate weaning, meal planning, and nutrition for growing children. Taking the guesswork out of feeding your family well.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-sage" />
                </div>
                <h3 className="text-xl font-semibold text-teal-dark mb-4">Smart Gadgets</h3>
                <p className="text-sage">
                  Reviewing and recommending the latest parent-tech gadgets that actually make family life easier, not more complicated.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-lavender/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="w-8 h-8 text-lavender" />
                </div>
                <h3 className="text-xl font-semibold text-teal-dark mb-4">Beyond & More</h3>
                <p className="text-sage">
                  From sleep solutions to educational resources, we're continuously expanding to help with every aspect of modern parenting.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="bg-white rounded-2xl p-8 max-w-4xl mx-auto shadow-lg">
              <h3 className="text-2xl font-semibold text-teal-dark mb-4">
                The Parent Helper Promise
              </h3>
              <p className="text-lg text-sage mb-6">
                We're here to give you back your most precious resource - time with your family. 
                Every feature we build, every recommendation we make, is designed with one goal: 
                making parenting a little bit easier and a lot more enjoyable.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-medium">Parents First</span>
                <span className="bg-sage/10 text-sage px-4 py-2 rounded-full text-sm font-medium">Technology for Good</span>
                <span className="bg-lavender/10 text-lavender px-4 py-2 rounded-full text-sm font-medium">Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
