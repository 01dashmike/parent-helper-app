import Header from "@/components/header";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Heart } from "lucide-react";

const faqItems = [
  {
    question: "How do I know if a class is suitable for my child's age?",
    answer: "Each class listing includes specific age ranges and developmental focuses. Our detailed descriptions help you understand what activities are involved and whether they match your child's current abilities and interests."
  },
  {
    question: "Are all classes on your platform verified and safe?",
    answer: "Yes, we thoroughly vet all class providers to ensure they meet safety standards, have appropriate insurance, and qualified instructors. We also monitor reviews and feedback to maintain quality standards."
  },
  {
    question: "How often is the class information updated?",
    answer: "Our database is updated in real-time through our Google Sheets integration. Class providers can update their information instantly, and new classes appear on the platform immediately after verification."
  },
  {
    question: "Can I book classes directly through your website?",
    answer: "We provide direct links to class providers' booking systems or contact information. While booking happens through the individual providers, we ensure all contact details are current and accurate."
  },
  {
    question: "What's the difference between featured and regular classes?",
    answer: "Featured classes are premium listings that appear at the top of search results. All classes, whether featured or not, meet our quality standards. Featured status simply provides additional visibility for class providers."
  },
  {
    question: "How do you determine which classes appear in search results?",
    answer: "Search results are ordered by popularity and relevance to your search criteria. Featured classes appear first, followed by regular classes sorted by popularity, rating, and distance from your location."
  },
  {
    question: "Do you offer refunds if I'm not satisfied with a class?",
    answer: "Refund policies are set by individual class providers. We encourage you to check their terms before booking. If you have concerns about a class, please contact us and we'll help mediate with the provider."
  },
  {
    question: "How can I leave a review for a class I attended?",
    answer: "After attending a class, you can leave a review by visiting the class page and clicking the 'Leave Review' button. Your honest feedback helps other parents make informed decisions."
  },
  {
    question: "Can I save classes to view later?",
    answer: "Yes! You can create a free account to save your favorite classes, receive personalized recommendations, and get notified when new classes are added in your area."
  },
  {
    question: "What if there are no classes in my area?",
    answer: "We're constantly expanding our coverage. Subscribe to our newsletter to be notified when new classes are added in your area. You can also suggest class providers through our contact form."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sage/10 via-lavender/10 to-coral/10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <HelpCircle className="w-4 h-4 text-coral mr-2" />
            <span className="text-sm font-medium text-teal-dark">Help & Support</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-teal-dark mb-6 leading-tight">
            Frequently Asked 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-sage"> Questions</span>
          </h1>
          
          <p className="text-xl text-sage mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about finding and booking the perfect classes for your little one across England
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="bg-coral/10 text-coral border-coral/20">
              <MessageSquare className="w-3 h-3 mr-1" />
              Quick Answers
            </Badge>
            <Badge variant="secondary" className="bg-sage/10 text-sage border-sage/20">
              <Heart className="w-3 h-3 mr-1" />
              Parent Friendly
            </Badge>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="space-y-6">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-gradient-to-r from-sage/5 to-coral/5 rounded-2xl border-none px-6 py-2"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6 group">
                      <h3 className="text-lg font-semibold font-poppins text-teal-dark pr-4 group-hover:text-coral transition-colors duration-300">
                        {item.question}
                      </h3>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-sage leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
