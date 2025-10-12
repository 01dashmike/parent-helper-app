import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CoverageMap from "@/components/coverage-map";
import ClassCard from "@/components/class-card";
import Helmet from "@/components/helmet";
import type { Class } from "@shared/schema";

interface LocalContext {
  venues: number;
  parkingSpots: number;
  transport: string;
}

export default function TownPage() {
  const { town } = useParams<{ town: string }>();
  const [localContext, setLocalContext] = useState<LocalContext | null>(null);

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: [`/api/classes/town/${town ?? ""}`],
    enabled: Boolean(town),
  });

  useEffect(() => {
    if (!town) return;

    fetch(`/api/local-context/${town}`)
      .then((response) => response.json())
      .then((data) => setLocalContext(data))
      .catch((error) => {
        console.error("Failed to load local context", error);
        setLocalContext(null);
      });
  }, [town]);

  const townName = town ?? "your area";
  const townCapitalized = townName.charAt(0).toUpperCase() + townName.slice(1);
  const metaDescription = `Find ${classes.length} baby and toddler classes in ${townCapitalized}. Swimming, music, sensory play and more.`;

  if (isLoading || !town) {
    return (
      <>
        <Helmet>
          <title>Baby & Toddler Classes in {townCapitalized} | Parent Helper</title>
          <meta name="description" content={metaDescription} />
        </Helmet>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl">Loading classes...</div>
        </div>
      </>
    );
  }

  if (!classes.length) {
    return (
      <>
        <Helmet>
          <title>Baby & Toddler Classes in {townCapitalized} | Parent Helper</title>
          <meta name="description" content={metaDescription} />
        </Helmet>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold">No classes yet in {townCapitalized}</h1>
          <p className="text-gray-600">
            Check back soon or search nearby towns.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Baby & Toddler Classes in {townCapitalized} | Parent Helper</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div
          className="relative h-96 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://source.unsplash.com/1600x900/?${townName},uk,town)`,
          }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 text-white">
          <h1 className="mb-4 text-5xl font-bold">
            Baby & Toddler Classes in {townCapitalized}
          </h1>
          <p className="text-xl">{classes.length} classes available now</p>
        </div>
      </div>

      <div className="border-b bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-coral">{classes.length}</div>
              <div className="text-gray-600">Active Classes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-sage">
                {localContext?.venues ?? "..."}
              </div>
              <div className="text-gray-600">Local Venues</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-lavender">
                {localContext?.parkingSpots ?? "..."}
              </div>
              <div className="text-gray-600">With Parking</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <CoverageMap classes={classes} fullScreen={false} />

              {localContext?.transport && (
                <div className="rounded-lg bg-white p-4 shadow">
                  <h3 className="mb-2 font-semibold">Getting Around</h3>
                  <p className="text-sm text-gray-600">{localContext.transport}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">All Classes</h2>
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
