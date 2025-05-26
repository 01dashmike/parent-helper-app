import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, BookOpen, Baby, Heart, Users, GraduationCap, Apple, Brain, Moon, Activity, Shield, Smile } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [forceRender, setForceRender] = useState(0);
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  const filteredPosts = selectedCategory 
    ? posts.filter(post => {
        const categories = post.category?.split(',').map(cat => cat.trim()) || [];
        return categories.includes(selectedCategory);
      })
    : posts;

  const getCategoryCount = (categoryId: string) => {
    return posts.filter(post => {
      const categories = post.category?.split(',').map(cat => cat.trim()) || [];
      return categories.includes(categoryId);
    }).length;
  };

  const categories = [
    {
      id: "prenatal",
      name: "Pre-natal",
      description: "Pregnancy tips, preparation for baby, and getting ready for parenthood",
      icon: Heart,
      color: "from-coral/20 to-coral/40",
      textColor: "text-coral",
      count: getCategoryCount("prenatal")
    },
    {
      id: "0-6-months",
      name: "0-6 Months",
      description: "Newborn care, feeding, sleep, and early development milestones",
      icon: Baby,
      color: "from-sage/20 to-sage/40",
      textColor: "text-sage",
      count: getCategoryCount("0-6-months")
    },
    {
      id: "baby-to-toddler",
      name: "Baby to Toddler",
      description: "Walking, talking, weaning, and transitioning to independence",
      icon: Activity,
      color: "from-lavender/20 to-lavender/40",
      textColor: "text-lavender",
      count: getCategoryCount("baby-to-toddler")
    },
    {
      id: "primary",
      name: "Primary",
      description: "School readiness, early learning, and social development",
      icon: BookOpen,
      color: "from-teal/20 to-teal/40",
      textColor: "text-teal",
      count: 0
    },
    {
      id: "junior",
      name: "Junior",
      description: "Independence skills, hobbies, and building confidence",
      icon: GraduationCap,
      color: "from-coral/20 to-coral/40",
      textColor: "text-coral",
      count: 0
    },
    {
      id: "senior",
      name: "Senior",
      description: "Preparing for secondary school and developing maturity",
      icon: Users,
      color: "from-sage/20 to-sage/40",
      textColor: "text-sage",
      count: 0
    },
    {
      id: "parents",
      name: "Parents",
      description: "Self-care, relationships, and supporting your own wellbeing",
      icon: Heart,
      color: "from-lavender/20 to-lavender/40",
      textColor: "text-lavender",
      count: 0
    },
    {
      id: "nutrition",
      name: "Nutrition",
      description: "Healthy eating, meal planning, and family-friendly recipes",
      icon: Apple,
      color: "from-teal/20 to-teal/40",
      textColor: "text-teal",
      count: getCategoryCount("nutrition")
    },
    {
      id: "sleep-routines",
      name: "Sleep & Routines",
      description: "Better sleep habits, bedtime routines, and daily structure",
      icon: Moon,
      color: "from-coral/20 to-coral/40",
      textColor: "text-coral",
      count: 0
    },
    {
      id: "development",
      name: "Development",
      description: "Milestones, growth tracking, and understanding your child's progress",
      icon: Brain,
      color: "from-sage/20 to-sage/40",
      textColor: "text-sage",
      count: 0
    },
    {
      id: "health-safety",
      name: "Health & Safety",
      description: "Keeping children safe, first aid, and health advice",
      icon: Shield,
      color: "from-lavender/20 to-lavender/40",
      textColor: "text-lavender",
      count: 0
    },
    {
      id: "behaviour",
      name: "Behaviour",
      description: "Positive discipline, managing tantrums, and emotional support",
      icon: Smile,
      color: "from-teal/20 to-teal/40",
      textColor: "text-teal",
      count: 0
    }
  ];

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 21) return "2 weeks ago";
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-poppins text-teal-dark mb-4">
              Parent Helper Blog Directory
            </h1>
            <p className="text-xl text-sage max-w-3xl mx-auto">
              Expert advice, practical tips, and guidance for every stage of your parenting journey. 
              Find exactly what you need with our easy-to-navigate directory designed for UK families.
            </p>
          </div>
        </div>
      </section>

      {/* Category Directory */}
      <section className="py-16 bg-gradient-to-br from-lavender/10 to-coral/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins text-teal-dark mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-sage max-w-2xl mx-auto">
              Choose the category that matches your current parenting stage or interest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id}
                  className="group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  onClick={() => {
                    if (category.id === "prenatal") {
                      window.location.href = "/blog/prenatal";
                    } else if (category.id === "0-6-months") {
                      window.location.href = "/blog/0-6-months";
                    } else if (category.id === "baby-to-toddler") {
                      window.location.href = "/blog/baby-to-toddler";
                    } else if (category.id === "primary") {
                      window.location.href = "/blog/primary";
                    } else if (category.id === "nutrition") {
                      window.location.href = "/blog/nutrition";
                    } else {
                      setSelectedCategory(category.id);
                    }
                  }}
                >
                  <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mr-4`}>
                        <IconComponent className={`w-6 h-6 ${category.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-poppins text-teal-dark group-hover:text-coral transition-colors">
                          {category.name}
                        </h3>
                        <span className="text-sm text-sage">
                          {category.count} articles
                        </span>
                      </div>
                    </div>
                    <p className="text-sage leading-relaxed mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center text-coral group-hover:text-coral/80 transition-colors">
                      <span className="text-sm font-medium">Explore articles</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Direct Display Section - Simple Approach */}
      {selectedCategory === "nutrition" && (
        <section className="py-16 bg-gradient-to-br from-teal-50 to-sage-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold font-poppins text-teal-dark mb-4">
                Nutrition Articles
              </h2>
              <Button 
                onClick={() => setSelectedCategory("")}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                ← Back to all categories
              </Button>
            </div>
            
            <Card className="max-w-2xl mx-auto shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 text-sm text-sage mb-4">
                  <Calendar className="w-4 h-4" />
                  May 25, 2025
                  <Clock className="w-4 h-4 ml-2" />
                  8 min read
                </div>
                <h3 className="text-2xl font-bold font-poppins text-teal-dark mb-4">
                  Weaning Your Baby: A Science-Backed Guide for First-Time Parents
                </h3>
                <p className="text-sage leading-relaxed mb-6">
                  The gradual transition from milk to solid food is one of your baby's biggest milestones. Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make this journey rewarding...
                </p>
                <Button className="bg-coral hover:bg-coral/90 text-white w-full">
                  Read Full Article
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {selectedCategory === "baby-to-toddler" && (
        <section className="py-16 bg-gradient-to-br from-lavender-50 to-sage-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold font-poppins text-teal-dark mb-4">
                Baby to Toddler Articles
              </h2>
              <Button 
                onClick={() => setSelectedCategory("")}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                ← Back to all categories
              </Button>
            </div>
            
            <Card className="max-w-2xl mx-auto shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 text-sm text-sage mb-4">
                  <Calendar className="w-4 h-4" />
                  May 25, 2025
                  <Clock className="w-4 h-4 ml-2" />
                  8 min read
                </div>
                <h3 className="text-2xl font-bold font-poppins text-teal-dark mb-4">
                  Weaning Your Baby: A Science-Backed Guide for First-Time Parents
                </h3>
                <p className="text-sage leading-relaxed mb-6">
                  The gradual transition from milk to solid food is one of your baby's biggest milestones. Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make this journey rewarding...
                </p>
                <Button className="bg-coral hover:bg-coral/90 text-white w-full">
                  Read Full Article
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Coming Soon Section - Only show when no category selected */}
      {!selectedCategory && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-coral/10 to-sage/10 rounded-2xl p-8">
              <BookOpen className="w-16 h-16 text-coral mx-auto mb-6" />
              <h3 className="text-2xl font-bold font-poppins text-teal-dark mb-4">
                Expert Content Coming Soon
              </h3>
              <p className="text-lg text-sage mb-6 max-w-2xl mx-auto">
                We're working with UK parenting experts, child development specialists, and experienced parents 
                to bring you authentic, practical advice for every stage of your journey.
              </p>
              <Button className="bg-coral hover:bg-coral/90 text-white">
                <Heart className="w-4 h-4 mr-2" />
                Get Notified When We Launch
              </Button>
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
}
