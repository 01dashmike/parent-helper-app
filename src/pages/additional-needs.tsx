import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Phone, Globe, Heart, Users, Zap, Brain, Accessibility } from "lucide-react";

interface Class {
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
  rating: string;
  wheelchairAccessible?: boolean;
  disabilitySupport?: string;
  specialRequirements?: string;
  languagesSpoken?: string;
  whatToExpect?: string;
  safetyMeasures?: string;
}

export default function AdditionalNeedsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedNeed, setSelectedNeed] = useState("");
  const [selectedAge, setSelectedAge] = useState("");

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes/search', { 
      search: searchTerm, 
      town: selectedTown,
      category: selectedNeed,
      ageGroup: selectedAge,
      additionalNeeds: true
    }],
  });

  const specialtyCategories = [
    { value: "autism", label: "Autism Support", icon: Brain, color: "bg-blue-100 text-blue-800" },
    { value: "sensory", label: "Sensory Support", icon: Zap, color: "bg-green-100 text-green-800" },
    { value: "physical", label: "Physical Support", icon: Accessibility, color: "bg-purple-100 text-purple-800" },
    { value: "speech", label: "Speech & Language", icon: Users, color: "bg-orange-100 text-orange-800" },
    { value: "inclusive", label: "Inclusive Classes", icon: Heart, color: "bg-pink-100 text-pink-800" },
  ];

  const ageGroups = [
    { value: "0-12", label: "Babies (0-12 months)" },
    { value: "12-36", label: "Toddlers (1-3 years)" },
    { value: "36-60", label: "Preschool (3-5 years)" },
    { value: "60+", label: "School Age (5+ years)" },
  ];

  const formatAge = (min: number, max: number) => {
    if (min === 0 && max <= 12) return "0-12 months";
    if (min <= 12 && max <= 36) return "1-3 years";
    if (min <= 36 && max <= 60) return "3-5 years";
    return "5+ years";
  };

  const parseDisabilitySupport = (support: string | undefined) => {
    if (!support) return [];
    try {
      return JSON.parse(support);
    } catch {
      return [support];
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Additional Needs Support
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Specialist classes and inclusive activities designed for children with additional needs. 
            Every child deserves the opportunity to learn, play, and thrive in a supportive environment.
          </p>
        </div>

        {/* Specialty Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {specialtyCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.value}
                variant={selectedNeed === category.value ? "default" : "outline"}
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => setSelectedNeed(selectedNeed === category.value ? "" : category.value)}
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-sm font-medium text-center">{category.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Find the Right Support</CardTitle>
            <CardDescription className="text-center">
              Search for specialist classes and inclusive activities in your area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search activities..."
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
                  <SelectValue placeholder="Select age group" />
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
            {classes.length > 0 && (
              <div className="text-center mb-6">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {classes.length} specialist activities found
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <Card 
                  key={classItem.id} 
                  className={`group hover:shadow-xl transition-all duration-300 ${
                    classItem.isFeatured ? 'ring-2 ring-purple-200 shadow-lg' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                          {classItem.name}
                          {classItem.isFeatured && (
                            <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">
                              Featured
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {classItem.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        {formatAge(classItem.ageGroupMin, classItem.ageGroupMax)}
                      </Badge>
                      {classItem.wheelchairAccessible && (
                        <Badge className="bg-green-100 text-green-800">
                          <Accessibility className="h-3 w-3 mr-1" />
                          Accessible
                        </Badge>
                      )}
                      {classItem.category && (
                        <Badge variant="outline">{classItem.category}</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Disability Support */}
                    {classItem.disabilitySupport && (
                      <div>
                        <h4 className="font-semibold text-sm text-purple-700 mb-2">Specialist Support:</h4>
                        <div className="flex flex-wrap gap-1">
                          {parseDisabilitySupport(classItem.disabilitySupport).map((support: string, idx: number) => (
                            <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs">
                              {support}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What to Expect */}
                    {classItem.whatToExpect && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-1">What to Expect:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{classItem.whatToExpect}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Location and Time */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-purple-500" />
                        <span>{classItem.venue}, {classItem.town}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span>{classItem.dayOfWeek}s at {classItem.time}</span>
                      </div>
                    </div>

                    {/* Languages Spoken */}
                    {classItem.languagesSpoken && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Languages: </span>
                        <span className="text-sm text-gray-600">
                          {parseLanguagesSpoken(classItem.languagesSpoken).join(', ')}
                        </span>
                      </div>
                    )}

                    <Separator />

                    {/* Contact and Pricing */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-purple-600">
                        {classItem.price || 'Contact for pricing'}
                      </div>
                      <div className="flex gap-2">
                        {classItem.contactPhone && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${classItem.contactPhone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {classItem.website && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={classItem.website} target="_blank" rel="noopener noreferrer">
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

            {classes.length === 0 && (searchTerm || selectedTown || selectedNeed) && (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No specialist activities found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We're constantly adding new additional needs support services. 
                    Try adjusting your search or contact us to suggest a service.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTown("");
                      setSelectedNeed("");
                      setSelectedAge("");
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Information Section */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-3">
                Supporting Every Child's Journey
              </h2>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Our additional needs section connects families with specialist providers who understand 
                the unique requirements of children with SEND, autism, sensory needs, and other conditions.
                Every activity listed has been verified for its inclusive approach and specialist support.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Brain className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-800 mb-2">Specialist Training</h3>
                <p className="text-sm text-gray-600">All providers have relevant training and experience</p>
              </div>
              <div className="text-center">
                <Accessibility className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-800 mb-2">Accessible Venues</h3>
                <p className="text-sm text-gray-600">Carefully selected accessible and sensory-friendly locations</p>
              </div>
              <div className="text-center">
                <Heart className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-800 mb-2">Inclusive Community</h3>
                <p className="text-sm text-gray-600">Building supportive communities for all families</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}