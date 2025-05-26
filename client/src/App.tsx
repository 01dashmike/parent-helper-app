import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import About from "@/pages/about";
import Blog from "@/pages/blog";
import BlogNutrition from "@/pages/blog-nutrition";
import BlogBabyToToddler from "@/pages/blog-baby-to-toddler";
import BlogWeaningGuide from "@/pages/blog-weaning-guide";
import FAQ from "@/pages/faq";
import ListClass from "@/pages/list-class";
import NewsletterAdmin from "@/pages/newsletter-admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/nutrition" component={BlogNutrition} />
      <Route path="/blog/baby-to-toddler" component={BlogBabyToToddler} />
      <Route path="/blog/weaning-guide" component={BlogWeaningGuide} />
      <Route path="/faq" component={FAQ} />
      <Route path="/list-class" component={ListClass} />
      <Route path="/newsletter-admin" component={NewsletterAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
