import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Franchise {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  defaultDiscountPercent: string;
  signupLinkSlug?: string;
  stripePromotionId?: string;
}

interface ProviderSummary {
  providerId: number;
  providerName: string;
  town?: string | null;
  postcode?: string | null;
  slug: string;
}

interface ProviderSearchResult {
  id: number;
  name: string;
  town?: string | null;
  postcode?: string | null;
  isClaimed?: boolean;
}

interface DiscountCode {
  id: number;
  code: string;
  description?: string | null;
  discountPercent: string;
  maxRedemptions?: number | null;
  redemptionCount: number;
  status: string;
  expiresAt?: string | null;
  stripePromotionId?: string | null;
}

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY;

async function request<T>(url: string, init?: RequestInit, expectJson = true): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (ADMIN_KEY) {
    headers["x-admin-key"] = ADMIN_KEY;
  }
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request to ${url} failed`);
  }
  if (!expectJson) return {} as T;
  return res.json() as Promise<T>;
}

export default function FranchiseAdminPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    defaultDiscountPercent: "10",
    notes: "",
  });
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | null>(null);
  const [franchiseProviders, setFranchiseProviders] = useState<ProviderSummary[]>([]);
  const [providerQuery, setProviderQuery] = useState("");
  const [providerResults, setProviderResults] = useState<ProviderSearchResult[]>([]);
  const [providerSearchLoading, setProviderSearchLoading] = useState(false);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [codeForm, setCodeForm] = useState({
    code: "",
    description: "",
    discountPercent: "10",
    maxRedemptions: "",
    expiresAt: "",
  });
  const [creatingCode, setCreatingCode] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
  const stripePlanned = import.meta.env.VITE_ENABLE_STRIPE_DISCOUNTS === "true";

  const selectedFranchise = useMemo(
    () => franchises.find((franchise) => franchise.id === selectedFranchiseId) ?? null,
    [franchises, selectedFranchiseId],
  );

  useEffect(() => {
    async function loadFranchises() {
      setIsLoading(true);
      try {
        const payload = await request<{ success: boolean; data: Franchise[] }>("/api/franchises?limit=200");
        setFranchises(payload.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load franchises");
      } finally {
        setIsLoading(false);
      }
    }

    loadFranchises();
  }, []);

  const loadFranchiseProviders = async (franchiseId: number) => {
    try {
      const payload = await request<{ success: boolean; data: ProviderSummary[] }>(
        `/api/franchises/${franchiseId}/providers`,
      );
      setFranchiseProviders(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load franchise providers");
    }
  };

  const loadDiscountCodes = async (franchiseId: number) => {
    try {
      const payload = await request<{ success: boolean; data: DiscountCode[] }>(
        `/api/franchises/${franchiseId}/discount-codes`,
      );
      setDiscountCodes(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discount codes");
    }
  };

  const handleCreateFranchise = async () => {
    if (!formState.name.trim() || !formState.slug.trim()) {
      setError("Please provide both name and slug");
      return;
    }

    try {
      const payload = await request<{ success: boolean; data: Franchise }>("/api/franchises", {
        method: "POST",
        body: JSON.stringify(formState),
      });
      setFranchises((prev) => [...prev, payload.data]);
      setFormState({ name: "", slug: "", defaultDiscountPercent: "10", notes: "" });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create franchise");
    }
  };

  useEffect(() => {
    if (!selectedFranchiseId) return;
    loadFranchiseProviders(selectedFranchiseId).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    });
    loadDiscountCodes(selectedFranchiseId).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load discount codes");
    });
  }, [selectedFranchiseId]);

  useEffect(() => {
    if (providerQuery.trim().length < 2) {
      setProviderResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setProviderSearchLoading(true);
        const res = await fetch(`/api/providers/search?q=${encodeURIComponent(providerQuery)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const payload = await res.json();
        setProviderResults(payload.data || []);
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Provider search failed");
        }
      } finally {
        setProviderSearchLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [providerQuery]);

  const attachProvider = async (providerId: number) => {
    if (!selectedFranchiseId) return;
    try {
      await request(`/api/franchises/${selectedFranchiseId}/providers`, {
        method: "POST",
        body: JSON.stringify({ providerId }),
      });
      await loadFranchiseProviders(selectedFranchiseId);
      setProviderQuery("");
      setProviderResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach provider");
    }
  };

  const detachProvider = async (providerId: number) => {
    if (!selectedFranchiseId) return;
    try {
      await request(`/api/franchises/${selectedFranchiseId}/providers/${providerId}`, {
        method: "DELETE",
      });
      await loadFranchiseProviders(selectedFranchiseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not detach provider");
    }
  };

  const handleCreateCode = async () => {
    if (!selectedFranchiseId) return;
    setCreatingCode(true);
    try {
      const payload = await request<{ success: boolean; data: DiscountCode }>(
        `/api/franchises/${selectedFranchiseId}/discount-codes`,
        {
          method: "POST",
          body: JSON.stringify({
            code: codeForm.code.trim() || undefined,
            description: codeForm.description.trim() || undefined,
            discountPercent: codeForm.discountPercent,
            maxRedemptions: codeForm.maxRedemptions ? Number(codeForm.maxRedemptions) : undefined,
            expiresAt: codeForm.expiresAt ? new Date(codeForm.expiresAt).toISOString() : undefined,
          }),
        },
      );
      setDiscountCodes((prev) => [...prev, payload.data]);
      setCodeForm({ code: "", description: "", discountPercent: codeForm.discountPercent, maxRedemptions: "", expiresAt: "" });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create discount code");
    } finally {
      setCreatingCode(false);
    }
  };

  const handleSendInvites = async () => {
    if (!selectedFranchiseId) return;
    const emails = inviteEmails
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter(Boolean);
    if (!emails.length) {
      setError("Add at least one email before sending invites");
      return;
    }

    setSendingInvites(true);
    try {
      await request(`/api/franchises/${selectedFranchiseId}/invites`, {
        method: "POST",
        body: JSON.stringify({
          emails,
          code: inviteCode || undefined,
        }),
      });
      setInviteEmails("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invites");
    } finally {
      setSendingInvites(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Franchise administration</h1>
          <p className="text-gray-600">
            Manage franchise brands, default discounts, and assign provider listings. This view is intended for internal
            use—gate it behind admin auth in production.
          </p>
          {ADMIN_KEY ? (
            <Badge className="bg-emerald-100 text-emerald-800">Admin key detected</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800">No ADMIN_API_KEY set (dev mode)</Badge>
          )}
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create new franchise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <Input value={formState.name} onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <Input
                  value={formState.slug}
                  onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="baby-sensory"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default discount %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={formState.defaultDiscountPercent}
                    onChange={(e) => setFormState((prev) => ({ ...prev, defaultDiscountPercent: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Signup link slug</label>
                  <Input
                    value={formState.signupLinkSlug ?? ""}
                    onChange={(e) => setFormState((prev) => ({ ...prev, signupLinkSlug: e.target.value }))}
                    placeholder="baby-sensory"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <Textarea
                  value={formState.notes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateFranchise}>Add franchise</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Franchise list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : franchises.length === 0 ? (
                <p className="text-sm text-gray-500">No franchises yet.</p>
              ) : (
                franchises.map((franchise) => (
                  <button
                    key={franchise.id}
                    type="button"
                    onClick={() => setSelectedFranchiseId(franchise.id)}
                    className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                      selectedFranchiseId === franchise.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{franchise.name}</p>
                        <p className="text-sm text-gray-500">/{franchise.slug}</p>
                      </div>
                      <Badge variant="outline">{franchise.defaultDiscountPercent}%</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {selectedFranchise && (
          <section className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedFranchise.name}</h2>
                <p className="text-sm text-gray-500">Partner link: /partner/{selectedFranchise.signupLinkSlug ?? selectedFranchise.slug}</p>
              </div>
            </header>

            <Card>
              <CardHeader>
                <CardTitle>Assigned providers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franchiseProviders.length === 0 ? (
                  <p className="text-sm text-gray-500">No providers linked yet.</p>
                ) : (
                  franchiseProviders.map((provider) => (
                    <div
                      key={provider.providerId}
                      className="flex items-center justify-between rounded border border-gray-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{provider.providerName}</p>
                        <p className="text-sm text-gray-500">
                          {[provider.town, provider.postcode].filter(Boolean).join(" • ") || "Location unknown"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => detachProvider(provider.providerId)}>
                        Remove
                      </Button>
                    </div>
                  ))
                )}

                <div className="rounded border border-dashed border-gray-300 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Attach another provider</p>
                  <Input
                    placeholder="Search providers…"
                    value={providerQuery}
                    onChange={(event) => setProviderQuery(event.target.value)}
                  />
                  {providerSearchLoading && <p className="text-xs text-gray-500">Searching…</p>}
                  {providerResults.length > 0 && (
                    <div className="space-y-2">
                      {providerResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => attachProvider(result.id)}
                          className="w-full text-left rounded border border-gray-200 px-3 py-2 hover:border-teal-400"
                        >
                          <p className="font-medium text-gray-900">{result.name}</p>
                          <p className="text-xs text-gray-500">
                            {[result.town, result.postcode].filter(Boolean).join(" • ") || "Location unknown"}
                          </p>
                          {result.isClaimed && (
                            <p className="text-xs text-teal-600">Already claimed</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code (optional)</label>
                      <Input
                        value={codeForm.code}
                        onChange={(e) => setCodeForm((prev) => ({ ...prev, code: e.target.value }))}
                        placeholder="PHFR-..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Input
                        value={codeForm.description}
                        onChange={(e) => setCodeForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Head office offer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount %</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={codeForm.discountPercent}
                        onChange={(e) => setCodeForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max redemptions</label>
                      <Input
                        type="number"
                        min={1}
                        value={codeForm.maxRedemptions}
                        onChange={(e) => setCodeForm((prev) => ({ ...prev, maxRedemptions: e.target.value }))}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Expires at</label>
                      <Input
                        type="datetime-local"
                        value={codeForm.expiresAt}
                        onChange={(e) => setCodeForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {stripePlanned
                      ? "Stripe sync toggled on. Codes will be created in Stripe when credentials are provided."
                      : "Stripe disabled. Codes stored locally until Stripe is configured."}
                  </div>
                  <Button onClick={handleCreateCode} disabled={creatingCode}>
                    {creatingCode ? "Creating…" : "Create discount code"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {discountCodes.length === 0 ? (
                    <p className="text-sm text-gray-500">No codes issued yet.</p>
                  ) : (
                    discountCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded border border-gray-200 p-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{code.code}</p>
                          <p className="text-sm text-gray-500">
                            {code.discountPercent}% • {code.redemptionCount}/{code.maxRedemptions ?? "∞"} redeemed
                            {code.expiresAt ? ` • expires ${new Date(code.expiresAt).toLocaleDateString()}` : ""}
                          </p>
                          {code.description && (
                            <p className="text-xs text-gray-500">{code.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-2 sm:mt-0">
                          {code.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded border border-dashed border-gray-300 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Invite franchisees by email</p>
                  <Textarea
                    rows={3}
                    placeholder="Enter email addresses separated by commas or new lines"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Use discount code (optional)</label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 text-sm"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    >
                      <option value="">Generate random code</option>
                      {discountCodes.map((code) => (
                        <option key={code.id} value={code.code}>
                          {code.code} ({code.discountPercent}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleSendInvites} disabled={sendingInvites}>
                    {sendingInvites ? "Sending…" : "Send invites"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
