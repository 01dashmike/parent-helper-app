import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Check, MapPin, Users, Clock, Lightbulb, MessageCircle, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import brandImage from "@assets/image_1748254024712.png";

export default function About() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please tell us what you'd like to see added to Parent Helper.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous',
          email: email.trim() || 'No email provided',
          message: message.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Feedback sent!",
          description: "Thank you for your suggestions. We'll consider them for future features.",
        });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      toast({
        title: "Failed to send feedback",
        description: "Please try again later or email us directly at notification@parenthelper.co.uk",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update document title and meta for SEO
  useEffect(() => {
    document.title = "About Parent Helper - Our Story | Baby & Toddler Classes Directory";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'The authentic story behind Parent Helper - how frustrated UK parents built a comprehensive directory to help families find baby classes, toddler activities, and parenting solutions across England.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'The authentic story behind Parent Helper - how frustrated parents built a comprehensive directory to help families find baby classes, toddler activities, and parenting solutions.';
      document.head.appendChild(meta);
    }

    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'parent helper story, UK parents, baby classes directory, toddler activities England, British families, parenting solutions, class finder UK';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold font-poppins text-teal-dark mb-6">
                Our Story: Parents Building Solutions for Families
              </h1>
              <p className="text-lg text-sage mb-6">
                As parents to three young children, we know the daily struggles all too well. Why is our baby crying? What sensory activities help development? Which baby classes should we try? Where do we go at weekends? What can we do on rainy evenings? How do we get them to eat healthy food they'll actually like? Which car seat is safest? The questions never end for families everywhere.
              </p>
              <p className="text-teal-dark mb-6">
                The endless searching for classes, clubs, family days out and more had become a time-consuming chore. We'd waste precious family time hunting down information that was scattered across dozens of different council websites, local Facebook groups, and community pages.
              </p>
              <p className="text-sage mb-6">
                That's when we realised we could use our passion for technology to solve this frustrating problem - not just for us, but for thousands of other parents facing the same daily challenges, from bustling cities to quiet market towns.
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
                src={brandImage}
                alt="Parent Helper brand identity - family logo and app design showing classes, clubs and activities" 
                className="rounded-2xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Growing Beyond Classes Section */}
      <section className="py-16 bg-gradient-to-br from-lavender/20 to-coral/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins text-teal-dark mb-4">
              Growing Beyond Classes: A Complete UK Parenting Ecosystem
            </h2>
            <p className="text-lg text-sage max-w-3xl mx-auto">
              Our mission is expanding across England. We're building a comprehensive parent helper ecosystem that addresses all the daily challenges British families face, from baby classes to family nutrition and beyond.
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

      {/* Feedback Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-poppins text-teal-dark mb-4">
              <MessageCircle className="w-8 h-8 inline mr-3" />
              Help Shape Parent Helper for UK Families
            </h3>
            <p className="text-lg text-sage max-w-2xl mx-auto">
              What would you like to see added to Parent Helper? Your feedback helps us build the features that matter most to British families across England. Share your suggestions and help us create the perfect parenting directory.
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-teal-dark font-medium">
                      Your Name (optional)
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Sarah"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 border-sage/20 focus:border-coral focus:ring-coral"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-teal-dark font-medium">
                      Email Address (optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. sarah@email.co.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 border-sage/20 focus:border-coral focus:ring-coral"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message" className="text-teal-dark font-medium">
                    What features would you like to see? *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="e.g. I'd love to see meal planning for toddlers, reviews of baby products, or better search filters for outdoor classes..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="mt-2 border-sage/20 focus:border-coral focus:ring-coral"
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-coral hover:bg-coral/90 text-white px-8 py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
