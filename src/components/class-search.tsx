import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Clock, Users, Phone, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchClasses } from "@/lib/database-client";
import CoverageMap from "@/components/coverage-map";
import type { Class as SharedClass } from "@shared/schema";

type SearchClass = SharedClass;

export function ClassSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nearbyTowns, setNearbyTowns] = useState<Array<{ name: string; count: number }>>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const trimmedSearchTerm = useMemo(() => searchTerm.trim(), [searchTerm]);

  const handleSearch = async () => {
    if (!trimmedSearchTerm) return;

    setLoading(true);
    setError("");

    try {
      const classes = await searchClasses({
        postcode: trimmedSearchTerm,
        radius: 15,
      });
      setResults(classes);
    } catch (err) {
      setError("Failed to search classes. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/classes?limit=200")
      .then((res) => res.json())
      .then((data) => {
        const classList: SearchClass[] | undefined = data?.data;
        if (!Array.isArray(classList)) return;
        const counts = new Map<string, number>();
        classList.forEach((item) => {
          if (!item.town) return;
          counts.set(item.town, (counts.get(item.town) ?? 0) + 1);
        });
        const formatted = Array.from(counts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setNearbyTowns(formatted);
      })
      .catch((err) => {
        console.error("Failed to load nearby towns", err);
      });
  }, []);

  useEffect(() => {
    if (trimmedSearchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/towns?q=${encodeURIComponent(trimmedSearchTerm)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (Array.isArray(payload?.data)) {
          setSuggestions(payload.data as string[]);
          setShowSuggestions(true);
        }
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") {
          console.error("Failed to load suggestions", err);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedSearchTerm]);

  const formatAgeRange = (min: number, max: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months}m`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) return `${years}y`;
      return `${years}y ${remainingMonths}m`;
    };

    return `${formatAge(min)} - ${formatAge(max)}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Find Baby & Toddler Classes
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Discover amazing classes and activities near you
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Enter your town or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setShowSuggestions(false);
                handleSearch();
              }
            }}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            className="pl-10"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={() => {
                    setSearchTerm(suggestion);
                    setShowSuggestions(false);
                    setSuggestions([]);
                    setTimeout(() => handleSearch(), 0);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!loading && results.length === 0 && trimmedSearchTerm && (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">
            No classes yet in {trimmedSearchTerm}
          </h1>
          <p className="text-gray-600 mb-6">
            We're adding new areas every week. Leave your email to be notified when classes are available.
          </p>

          <form className="max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border rounded mb-2"
            />
            <button className="w-full bg-coral text-white py-2 rounded" type="button">
              Notify Me
            </button>
          </form>

          {nearbyTowns.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">Classes in nearby areas:</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {nearbyTowns.map((town) => (
                  <a
                    key={town.name}
                    href={`/classes/${encodeURIComponent(town.name)}`}
                    className="p-4 border rounded hover:border-coral transition"
                  >
                    <div className="font-semibold">{town.name}</div>
                    <div className="text-sm text-gray-600">{town.count} classes</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Found {results.length} classes
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <CoverageMap
                  classes={results}
                  fullScreen={false}
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {results.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{classItem.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {classItem.venue} • {classItem.town}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {classItem.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      {classItem.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>Ages {formatAgeRange(classItem.ageGroupMin, classItem.ageGroupMax)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{classItem.dayOfWeek}s {classItem.time}</span>
                      </div>

                      {classItem.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            £{classItem.price}
                          </span>
                        </div>
                      )}

                      {classItem.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{classItem.rating}</span>
                          {classItem.reviewCount && (
                            <span className="text-gray-500">({classItem.reviewCount})</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4" />
                        <span>{classItem.address}, {classItem.postcode}</span>
                      </div>

                      <div className="flex gap-2">
                        {classItem.contactPhone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${classItem.contactPhone}`}>
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </a>
                          </Button>
                        )}

                        {classItem.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={classItem.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4 mr-1" />
                              Website
                            </a>
                          </Button>
                        )}

                        {classItem.contactEmail && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${classItem.contactEmail}`}>
                              Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
