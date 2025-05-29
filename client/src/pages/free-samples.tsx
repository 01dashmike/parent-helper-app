import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Gift, Shield, AlertTriangle, CheckCircle, Baby, Heart, Users } from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";
import Footer from "@/components/footer";

const majorBrands = [
  {
    name: "Pampers UK",
    website: "https://www.pampers.co.uk",
    offers: ["Free nappy samples", "Baby club rewards", "Pregnancy packs"],
    signupRequired: true,
    description: "Pampers Baby Club - requires email signup",
    category: "Nappies & Care"
  },
  {
    name: "Huggies UK", 
    website: "https://www.huggies.co.uk",
    offers: ["Free sample packs", "Newborn starter kits"],
    signupRequired: true,
    description: "Huggies rewards program",
    category: "Nappies & Care"
  },
  {
    name: "Aptamil",
    website: "https://www.aptaclub.co.uk",
    offers: ["Free formula samples", "Weaning guides", "Baby development info"],
    signupRequired: true,
    description: "Aptaclub membership required",
    category: "Baby Formula"
  },
  {
    name: "Cow & Gate",
    website: "https://www.cowandgate.co.uk", 
    offers: ["Free samples", "Pregnancy support packs"],
    signupRequired: true,
    description: "Baby Club membership",
    category: "Baby Formula"
  }
];

const retailChains = [
  {
    name: "Boots Baby",
    website: "https://www.boots.com/baby-and-child",
    offers: ["Parenting Club benefits", "Free baby event workshops"],
    signupRequired: true,
    description: "Boots Parenting Club - in-store and online benefits",
    category: "Retail"
  },
  {
    name: "Mothercare",
    website: "https://www.mothercare.com",
    offers: ["Pregnancy clubs", "Baby event samples"],
    signupRequired: false,
    description: "In-store baby events often have free samples",
    category: "Retail"
  }
];

const parentingOrgs = [
  {
    name: "Emma's Diary",
    website: "https://www.emmasdiary.co.uk",
    offers: ["Free pregnancy packs", "Baby welcome boxes", "Vouchers"],
    signupRequired: true,
    description: "Established UK pregnancy resource with verified offers",
    category: "Parenting Support"
  },
  {
    name: "Bounty",
    website: "https://www.bounty.com",
    offers: ["Pregnancy packs", "Baby packs", "Family vouchers"],
    signupRequired: true,
    description: "Hospital partnership program - legitimate source",
    category: "Parenting Support"
  },
  {
    name: "NCT (National Childbirth Trust)",
    website: "https://www.nct.org.uk",
    offers: ["Free parenting guides", "Local group trials"],
    signupRequired: false,
    description: "Charity offering authentic parenting support",
    category: "Parenting Support"
  }
];

const safetyGuidelines = [
  "Only use official brand websites - avoid third-party sites",
  "Never pay for 'free' samples (shipping should be genuinely free)",
  "Be cautious about sharing personal details beyond basic contact info",
  "Check offer expiry dates and terms",
  "Verify the company is legitimate (established brands only)",
  "Read privacy policies before signing up",
  "Use a dedicated email for offer signups to manage communications"
];

const offerTypes = [
  {
    icon: Baby,
    title: "Free Nappies/Samples",
    description: "Small sample packs (usually 2-4 nappies), different sizes available"
  },
  {
    icon: Heart,
    title: "Baby Formula Samples", 
    description: "Single-use sachets or small tins, age-appropriate formulas"
  },
  {
    icon: Gift,
    title: "Baby Care Products",
    description: "Travel-size shampoos, lotions, wipes samples"
  },
  {
    icon: Users,
    title: "Information Packs",
    description: "Pregnancy guides, baby development charts, feeding guides"
  }
];

function BrandCard({ brand }: { brand: any }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{brand.name}</CardTitle>
            <Badge variant="outline" className="mt-1">{brand.category}</Badge>
          </div>
          {brand.signupRequired && (
            <Badge className="bg-blue-100 text-blue-700">Signup Required</Badge>
          )}
        </div>
        <CardDescription className="text-sm">{brand.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Available Offers:</h4>
            <ul className="space-y-1">
              {brand.offers.map((offer: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  {offer}
                </li>
              ))}
            </ul>
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.open(brand.website, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Official Website
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FreeSamplesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Baby Samples & Offers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover genuine free samples and offers from trusted UK baby brands. 
            All sources are verified and legitimate.
          </p>
        </div>

        {/* Safety Alert */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Safety First:</strong> Only use official brand websites listed below. 
            Be cautious of third-party sites offering "free" samples that require payment.
          </AlertDescription>
        </Alert>

        {/* Offer Types */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {offerTypes.map((type, index) => {
              const IconComponent = type.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <IconComponent className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{type.title}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Major Brands */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Major Baby Brands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {majorBrands.map((brand, index) => (
              <BrandCard key={index} brand={brand} />
            ))}
          </div>
        </section>

        {/* Retail Chains */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Retail Chains</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {retailChains.map((brand, index) => (
              <BrandCard key={index} brand={brand} />
            ))}
          </div>
        </section>

        {/* Parenting Organizations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Parenting Organizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentingOrgs.map((brand, index) => (
              <BrandCard key={index} brand={brand} />
            ))}
          </div>
        </section>

        {/* Safety Guidelines */}
        <section className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Safety Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {safetyGuidelines.map((guideline, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    {guideline}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Bottom CTA */}
        <div className="text-center bg-teal-50 rounded-lg p-8">
          <Gift className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Always Verify Before Sharing Details
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Remember to visit official websites directly and read terms and conditions. 
            If an offer seems too good to be true, verify it's from the legitimate brand website.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}