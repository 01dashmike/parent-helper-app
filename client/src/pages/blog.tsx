import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, BookOpen, Baby, Heart, Users, GraduationCap, Apple, Brain, Moon, Activity, Shield, Smile } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
    const count = posts.filter(post => {
      const categories = post.category?.split(',').map(cat => cat.trim()) || [];
      console.log('Post:', post.title, 'Categories:', categories, 'Looking for:', categoryId);
      return categories.includes(categoryId);
    }).length;
    console.log('Count for', categoryId, ':', count);
    return count;
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
                  onClick={() => setSelectedCategory(category.id)}
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

      {/* Blog Posts Section */}
      {selectedCategory && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold font-poppins text-teal-dark mb-2">
                  {categories.find(cat => cat.id === selectedCategory)?.name} Articles
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCategory(null)}
                  className="text-sage hover:text-coral"
                >
                  ← Back to all categories
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-sage mb-3">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.createdAt).toLocaleDateString()}
                      <Clock className="w-4 h-4 ml-2" />
                      {post.readTimeMinutes} min read
                    </div>
                    <h3 className="text-xl font-bold font-poppins text-teal-dark mb-3 group-hover:text-coral transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sage leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-coral group-hover:text-coral/80 transition-colors">
                      <span className="text-sm font-medium">Read article</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
