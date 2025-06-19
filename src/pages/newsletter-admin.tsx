import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Send, BarChart3, Calendar, CheckCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface NewsletterStats {
  totalSubscribers: number;
  subscribersWithPostcodes: number;
  topPostcodeAreas: { area: string; count: number }[];
}

export default function NewsletterAdmin() {
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();

  // Get newsletter statistics
  const { data: stats, isLoading: statsLoading } = useQuery<NewsletterStats>({
    queryKey: ['/api/newsletter/stats'],
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/newsletter/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to send campaign");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Newsletter campaign sent!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/newsletter/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Campaign failed",
        description: error.message || "Failed to send newsletter campaign",
        variant: "destructive",
      });
    },
  });

  // Send test newsletter mutation
  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/newsletter/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to send test newsletter");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test newsletter sent!",
        description: `Preview newsletter delivered to ${testEmail}`,
      });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to send test newsletter",
        variant: "destructive",
      });
    },
  });

  // Schedule weekly newsletter mutation
  const weeklyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/newsletter/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to trigger weekly newsletter");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Weekly newsletter triggered!",
        description: "Newsletter campaign has been sent to all subscribers",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Weekly newsletter failed",
        description: error.message || "Failed to trigger weekly newsletter",
        variant: "destructive",
      });
    },
  });

  const handleSendCampaign = () => {
    sendCampaignMutation.mutate();
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address for the test",
        variant: "destructive",
      });
      return;
    }
    sendTestMutation.mutate(testEmail);
  };

  const handleWeeklyNewsletter = () => {
    weeklyMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Newsletter Administration</h1>
        <p className="text-muted-foreground">
          Manage your Parent Helper newsletter campaigns with personalized content and local class updates
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Campaign</TabsTrigger>
          <TabsTrigger value="test">Test Newsletter</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalSubscribers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active newsletter subscribers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Postcodes</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.subscribersWithPostcodes || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Personalized local content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.topPostcodeAreas?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Different postcode areas
                </p>
              </CardContent>
            </Card>
          </div>

          {stats?.topPostcodeAreas && stats.topPostcodeAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Subscriber Areas</CardTitle>
                <CardDescription>
                  Geographic distribution of your newsletter subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {stats.topPostcodeAreas.map(({ area, count }) => (
                    <div key={area} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{area}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Newsletter Features</CardTitle>
              <CardDescription>
                What makes your newsletters special
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Personalized parenting tips by age group</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Local class recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Location-based content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Beautiful HTML design</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Newsletter Campaign</span>
              </CardTitle>
              <CardDescription>
                Send newsletters to all subscribers with personalized content and local class updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">This campaign will include:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 2 personalized parenting tips based on age groups</li>
                  <li>• Local classes within 15 miles of each subscriber</li>
                  <li>• Beautiful HTML format with your branding</li>
                  <li>• Motivational parenting reminders</li>
                </ul>
              </div>

              <Button 
                onClick={handleSendCampaign}
                disabled={sendCampaignMutation.isPending}
                className="w-full"
                size="lg"
              >
                {sendCampaignMutation.isPending ? (
                  "Sending newsletters..."
                ) : (
                  `Send to ${stats?.totalSubscribers || 0} subscribers`
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Newsletter</CardTitle>
              <CardDescription>
                Send a test newsletter to preview how it looks before sending to all subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address for test..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending || !testEmail}
                className="w-full"
              >
                {sendTestMutation.isPending ? "Sending test..." : "Send Test Newsletter"}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                The test email must be from an existing subscriber to see personalized content
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Weekly Newsletter</span>
              </CardTitle>
              <CardDescription>
                Trigger the weekly newsletter campaign manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  In production, this would be automated with a cron job to run every Sunday evening. 
                  For now, you can trigger it manually here.
                </p>
              </div>

              <Button 
                onClick={handleWeeklyNewsletter}
                disabled={weeklyMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {weeklyMutation.isPending ? "Sending weekly newsletter..." : "Trigger Weekly Newsletter"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}