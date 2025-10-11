import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AIChatbot } from "@/components/ai-chatbot";
import Home from "@/pages/home";
import Services from "@/pages/services";
import About from "@/pages/about";
import Blog from "@/pages/blog";
import SearchPage from "@/pages/search";
import TownPage from "@/pages/town";
import NotFound from "@/pages/not-found";

function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/services" component={Services} />
            <Route path="/about" component={About} />
            <Route path="/blog" component={Blog} />
            <Route path="/search" component={SearchPage} />
            <Route path="/classes/:town" component={TownPage} />
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
                <AIChatbot />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;