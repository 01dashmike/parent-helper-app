import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertNewsletter, Newsletter } from "@shared/schema";

export function useNewsletter() {
  const queryClient = useQueryClient();

  const subscribeMutation = useMutation({
    mutationFn: async (data: InsertNewsletter): Promise<Newsletter> => {
      const response = await apiRequest("POST", "/api/newsletter/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      // Optionally invalidate any newsletter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (email: string): Promise<void> => {
      await apiRequest("POST", "/api/newsletter/unsubscribe", { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
    },
  });

  return {
    subscribe: subscribeMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
    error: subscribeMutation.error || unsubscribeMutation.error,
  };
}
