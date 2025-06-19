import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Mail } from "lucide-react";
import { useNewsletter } from "@/hooks/use-newsletter";
import { useToast } from "@/hooks/use-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const { subscribe, isLoading } = useNewsletter();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      await subscribe({ email, postcode: undefined, isActive: true });
      setEmail("");
      toast({
        title: "Subscribed successfully!",
        description: "You'll receive notifications about new classes in your area.",
      });
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="bg-gradient-to-r from-coral/10 to-sky-soft/10 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <img 
            src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
            alt="Happy mother with baby" 
            className="w-32 h-32 rounded-full object-cover mx-auto mb-6"
          />
        </div>
        
        <h3 className="text-3xl font-bold font-poppins text-gray-900 mb-4">
          Never Miss New Classes in Your Area
        </h3>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get notified when new baby and toddler classes are added near you. Plus, receive weekly tips and activities for your little one's development.
        </p>
        
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-coral transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="bg-coral hover:bg-coral/90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2 text-coral" />
            We respect your privacy. Unsubscribe at any time.
          </div>
        </div>
      </div>
    </section>
  );
}
