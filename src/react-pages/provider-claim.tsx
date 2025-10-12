import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  providerClaimRequestSchema,
  type ProviderClaimRequest,
} from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProviderSummary {
  id: number;
  name: string;
  slug: string;
  town?: string | null;
  postcode?: string | null;
  isClaimed?: boolean;
  claimStatus?: string;
}

interface FranchiseSummary {
  id: number;
  name: string;
  slug: string;
}

export default function ProviderClaimPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const form = useForm<ProviderClaimRequest>({
    resolver: zodResolver(providerClaimRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      relationship: "",
      website: "",
      proofUrl: "",
      message: "",
      franchiseId: undefined,
    },
  });

  useEffect(() => {
    setIsLoadingFranchises(true);
    fetch("/api/franchises?limit=100")
      .then((res) => res.json())
      .then((payload) => {
        if (Array.isArray(payload?.data)) {
          setFranchises(payload.data as FranchiseSummary[]);
        }
      })
      .catch((error) => {
        console.error("Failed to load franchises", error);
      })
      .finally(() => setIsLoadingFranchises(false));
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/providers/search?q=${encodeURIComponent(trimmedQuery)}&limit=8`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error("Failed to fetch provider suggestions");
        }
        const payload = await res.json();
        if (Array.isArray(payload?.data)) {
          setResults(payload.data as ProviderSummary[]);
        }
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error(error);
          toast({
            title: "Search failed",
            description: "We couldn't load provider suggestions. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery, toast]);

  const handleSubmit = async (values: ProviderClaimRequest) => {
    if (!selectedProvider) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/providers/${selectedProvider.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(payload?.error || "Failed to submit claim");
      }

      setSuccessMessage(
        `Thanks, ${values.fullName}! We've received your request and will be in touch within 2 working days.`,
      );
      form.reset({
        fullName: "",
        email: "",
        phone: "",
        relationship: "",
        website: "",
        proofUrl: "",
        message: "",
        franchiseId: undefined,
      });
      setSelectedProvider(null);
      setQuery("");
      setResults([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit claim";
      toast({
        title: "Unable to submit claim",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <header className="space-y-4 text-center">
          <Badge className="bg-teal-100 text-teal-800">For Providers</Badge>
          <h1 className="text-4xl font-bold text-gray-900">Claim your Parent Helper listing</h1>
          <p className="text-lg text-gray-600">
            We'll verify your details and connect your classes to our dashboard so you can edit
            information, upload photos, and access analytics.
          </p>
        </header>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <label htmlFor="provider-search" className="block text-sm font-medium text-gray-700">
              Search for your business or class name
            </label>
            <div className="mt-2 relative">
              <Input
                id="provider-search"
                placeholder="e.g. Little Steps Baby Sensory, Bristol"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedProvider(null);
                  setSuccessMessage(null);
                }}
                className="h-11"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Searching…
                </div>
              )}
            </div>
          </div>

          {results.length > 0 && (
            <div className="border border-gray-200 rounded-xl divide-y">
              {results.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setSuccessMessage(null);
                    form.reset();
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50 transition",
                    selectedProvider?.id === provider.id ? "bg-teal-50 border-l-4 border-teal-500" : "",
                  )}
                >
                  <div>
                    <p className="text-base font-semibold text-gray-900">{provider.name}</p>
                    <p className="text-sm text-gray-600">
                      {[provider.town, provider.postcode].filter(Boolean).join(" • ") || "Location coming soon"}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {provider.isClaimed ? "Already claimed" : "Available to claim"}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedProvider && (
            <div className="space-y-6">
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-5">
                <h2 className="text-lg font-semibold text-teal-900">Claiming {selectedProvider.name}</h2>
                <p className="text-sm text-teal-800 mt-1">
                  Provide a few details below so we can verify your connection to this provider.
                </p>
              </div>

              {successMessage ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-800">
                  {successMessage}
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Franchise brand</label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 text-sm"
                      value={form.watch("franchiseId") ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        form.setValue("franchiseId", value ? Number(value) : undefined, { shouldDirty: true });
                      }}
                      disabled={isLoadingFranchises}
                    >
                      <option value="">Independent / Not listed</option>
                      {franchises.map((franchise) => (
                        <option key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Pick your franchise if applicable so we can route your request faster.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Your name</label>
                      <Input placeholder="Alex Taylor" {...form.register("fullName")} />
                      {form.formState.errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <Input type="email" placeholder="you@example.com" {...form.register("email")} />
                      {form.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                      <Input placeholder="07xxx xxx xxx" {...form.register("phone")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Your role</label>
                      <Input placeholder="Owner, Area Manager, Franchisee…" {...form.register("relationship")} />
                      {form.formState.errors.relationship && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.relationship.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Official website (optional)</label>
                      <Input placeholder="https://" {...form.register("website")} />
                      {form.formState.errors.website && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.website.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Proof link (optional)</label>
                      <Input placeholder="Companies House, franchisor portal…" {...form.register("proofUrl")} />
                      {form.formState.errors.proofUrl && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.proofUrl.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tell us more</label>
                    <Textarea
                      rows={4}
                      placeholder="Share anything that helps us verify your connection (e.g. franchise agreement, listing URL, business registration)."
                      {...form.register("message")}
                    />
                    {form.formState.errors.message && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.message.message}</p>
                    )}
                  </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedProvider(null);
                      setSuccessMessage(null);
                      form.reset({
                        fullName: "",
                        email: "",
                        phone: "",
                        relationship: "",
                        website: "",
                        proofUrl: "",
                        message: "",
                        franchiseId: undefined,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending…" : "Submit claim"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What happens next?</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>We review your claim and may reach out if we need extra proof.</li>
            <li>Once approved, you’ll get an email invite to create your provider dashboard account.</li>
            <li>From there you can edit your listings, add photos, and see analytics.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
