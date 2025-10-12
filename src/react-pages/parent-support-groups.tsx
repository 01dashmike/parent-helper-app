import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Phone, Globe, Users, Heart, Coffee, MessageCircle, Baby, Smile } from "lucide-react";

interface SupportGroup {
  id: number;
  name: string;
  description: string;
  venue: string;
  address: string;
  town: string;
  postcode: string;
  dayOfWeek: string;
  time: string;
  price: string;
  contactPhone: string;
  website: string;
  category: string;
  ageGroupMin: number;
  ageGroupMax: number;
  isFeatured: boolean;
  whatToExpect?: string;
  specialRequirements?: string;
  languagesSpoken?: string;
  providerExperience?: string;
}

export default function ParentSupportGroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAge, setSelectedAge] = useState("");

  const { data: groups = [], isLoading } = useQuery<SupportGroup[]>({
    queryKey: ['/api/classes/search', { 
      search: searchTerm, 
      town: selectedTown,
      category: selectedType,
      ageGroup: selectedAge,
      serviceType: 'support-groups'
    }],
  });

  const supportTypes = [
    { value: "new-parents", label: "New Parents", icon: Baby, color: "bg-pink-100 text-pink-800" },
    { value: "postnatal", label: "Postnatal Support", icon: Heart, color: "bg-red-100 text-red-800" },
    { value: "additional-needs", label: "Additional Needs", icon: Users, color: "bg-purple-100 text-purple-800" },
    { value: "single-parents", label: "Single Parents", icon: Smile, color: "bg-blue-100 text-blue-800" },
    { value: "mental-health", label: "Mental Health", icon: MessageCircle, color: "bg-green-100 text-green-800" },
    { value: "general", label: "General Support", icon: Coffee, color: "bg-orange-100 text-orange-800" },
  ];

  const ageGroups = [
    { value: "pregnancy", label: "Pregnancy" },
    { value: "0-6months", label: "0-6 months" },
    { value: "6-12months", label: "6-12 months" },
    { value: "1-2years", label: "1-2 years" },
    { value: "2-5years", label: "2-5 years" },
    { value: "school-age", label: "School age" },
    { value: "all-ages", label: "All ages" },
  ];

  const formatAge = (min: number, max: number) => {
    if (min === 0 && max <= 6) return "Pregnancy & newborn";
    if (min === 0 && max <= 12) return "0-12 months";
    if (min <= 12 && max <= 24) return "1-2 years";
    if (min <= 24 && max <= 60) return "2-5 years";
    return "All ages welcome";
  };

  const parseLanguagesSpoken = (languages: string | undefined) => {
    if (!languages) return [];
    try {
      return JSON.parse(languages);
    } catch {
      return [languages];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-10 w-10 text-pink-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Parent Support Groups
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect with other parents, share experiences, and find the support you need. 
            Parenting can be challenging - you don't have to do it alone.
          </p>
        </div>

        {/* Support Type Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {supportTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Button
                key={type.value}
                variant={selectedType === type.value ? "default" : "outline"}
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => setSelectedType(selectedType === type.value ? "" : type.value)}
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{type.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Find Your Community</CardTitle>
            <CardDescription className="text-center">
              Search for parent support groups and communities in your area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search support groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:col-span-2"
              />
              <Input
                placeholder="Enter your town or postcode"
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
              />
              <Select value={selectedAge} onValueChange={setSelectedAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Child's age" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="text-center mb-6">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {groups.length} support groups found
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card 
                  key={group.id} 
                  className={`group hover:shadow-xl transition-all duration-300 ${
                    group.isFeatured ? 'ring-2 ring-pink-200 shadow-lg' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-pink-600 transition-colors">
                          {group.name}
                          {group.isFeatured && (
                            <Badge className="ml-2 bg-gradient-to-r from-pink-500 to-purple-500">
                              Featured
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {group.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-pink-100 text-pink-800">
                        {formatAge(group.ageGroupMin, group.ageGroupMax)}
                      </Badge>
                      {group.category && (
                        <Badge variant="outline" className="capitalize">
                          {group.category.replace('-', ' ')}
                        </Badge>
                      )}
                      {group.price === "Free" && (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* What to Expect */}
                    {group.whatToExpect && (
                      <div>
                        <h4 className="font-semibold text-sm text-pink-700 mb-1">What to Expect:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{group.whatToExpect}</p>
                      </div>
                    )}

                    {/* Provider Experience */}
                    {group.providerExperience && (
                      <div>
                        <h4 className="font-semibold text-sm text-pink-700 mb-1">Facilitator:</h4>
                        <p className="text-sm text-gray-600">{group.providerExperience}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Location and Time */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-pink-500" />
                        <span>{group.venue}, {group.town}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-pink-500" />
                        <span>{group.dayOfWeek}s at {group.time}</span>
                      </div>
                    </div>

                    {/* Languages Spoken */}
                    {group.languagesSpoken && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Languages: </span>
                        <span className="text-sm text-gray-600">
                          {parseLanguagesSpoken(group.languagesSpoken).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {group.specialRequirements && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-1">Requirements:</h4>
                        <p className="text-sm text-gray-600">{group.specialRequirements}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Contact and Pricing */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-pink-600">
                        {group.price || 'Free to attend'}
                      </div>
                      <div className="flex gap-2">
                        {group.contactPhone && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${group.contactPhone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {group.website && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={group.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {groups.length === 0 && (searchTerm || selectedTown || selectedType) && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No support groups found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We're constantly adding new parent support groups and communities. 
                    Try adjusting your search or contact us to suggest a group.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTown("");
                      setSelectedType("");
                      setSelectedAge("");
                    }}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Information Section */}
        <Card className="mt-12 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-pink-800 mb-3">
                Building Supportive Communities
              </h2>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Parent support groups provide invaluable emotional support, practical advice, and lasting friendships. 
                Whether you're dealing with sleep challenges, developmental concerns, or just need someone who understands, 
                these groups offer a safe space to share and connect.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-pink-600 mx-auto mb-3" />
                <h3 className="font-semibold text-pink-800 mb-2">Peer Support</h3>
                <p className="text-sm text-gray-600">Connect with parents facing similar challenges and experiences</p>
              </div>
              <div className="text-center">
                <Heart className="h-12 w-12 text-pink-600 mx-auto mb-3" />
                <h3 className="font-semibold text-pink-800 mb-2">Professional Guidance</h3>
                <p className="text-sm text-gray-600">Many groups are facilitated by qualified professionals</p>
              </div>
              <div className="text-center">
                <Coffee className="h-12 w-12 text-pink-600 mx-auto mb-3" />
                <h3 className="font-semibold text-pink-800 mb-2">Welcoming Environment</h3>
                <p className="text-sm text-gray-600">Judgment-free spaces where all parents are welcome</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}