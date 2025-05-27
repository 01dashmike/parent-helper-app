import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Clubs from "@/pages/clubs";
import About from "@/pages/about";
import Blog from "@/pages/blog";
import BlogNutrition from "@/pages/blog-nutrition";
import BlogBabyToToddler from "@/pages/blog-baby-to-toddler";
import Blog06Months from "@/pages/blog-0-6-months";
import BlogPrenatal from "@/pages/blog-prenatal";
import BlogPrimary from "@/pages/blog-primary";
import BlogWeaningGuide from "@/pages/blog-weaning-guide";
import BlogNewbornBehavior from "@/pages/blog-newborn-behavior";
import FAQ from "@/pages/faq";
import ListClass from "@/pages/list-class";
import NewsletterAdmin from "@/pages/newsletter-admin";
import NotFound from "@/pages/not-found";
import AfterSchoolClubsPage from "./pages/after-school-clubs";
import PhotographyKeepsakesPage from "./pages/photography-keepsakes";
import AdditionalNeedsPage from "./pages/additional-needs";
import ParentSupportGroupsPage from "./pages/parent-support-groups";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/baby-toddler-classes" component={Home} />
      <Route path="/family-services" component={Services} />
      <Route path="/family-specialists" component={Services} />
      <Route path="/after-school-clubs" component={AfterSchoolClubsPage} />
      <Route path="/photography-keepsakes" component={PhotographyKeepsakesPage} />
      <Route path="/additional-needs" component={AdditionalNeedsPage} />
      <Route path="/parent-support-groups" component={ParentSupportGroupsPage} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/prenatal" component={BlogPrenatal} />
      <Route path="/blog/0-6-months" component={Blog06Months} />
      <Route path="/blog/baby-to-toddler" component={BlogBabyToToddler} />
      <Route path="/blog/primary" component={BlogPrimary} />
      <Route path="/blog/nutrition" component={BlogNutrition} />
      <Route path="/blog/weaning-guide" component={BlogWeaningGuide} />
      <Route path="/blog/newborn-behavior" component={BlogNewbornBehavior} />
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
