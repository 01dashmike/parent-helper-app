import express from "express";
import crypto from "node:crypto";
import { eq, ilike, or } from "drizzle-orm";
import { db } from "../db.js";
import {
  providers,
  providerClaims,
  providerClaimRequestSchema,
  franchises,
  type ProviderClaimRequest,
} from "@shared/schema";
import {
  sendProviderClaimAdminNotification,
  sendProviderClaimantConfirmation,
} from "../email-service.js";

const router = express.Router();

router.get("/api/providers/search", async (req, res) => {
  try {
    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    let whereClause;
    if (search.length > 0) {
      const pattern = `%${search}%`;
      whereClause = or(
        ilike(providers.name, pattern),
        ilike(providers.town, pattern),
        ilike(providers.postcode, pattern),
      );
    }

    const rows = await db
      .select({
        id: providers.id,
        name: providers.name,
        slug: providers.slug,
        town: providers.town,
        postcode: providers.postcode,
        isClaimed: providers.isClaimed,
        claimStatus: providers.claimStatus,
      })
      .from(providers)
      .where(whereClause ?? undefined)
      .limit(limit)
      .orderBy(providers.name);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Provider search error", error);
    res.status(500).json({ success: false, error: "Failed to search providers" });
  }
});

router.post("/api/providers/:providerId/claim", async (req, res) => {
  try {
    const providerId = Number.parseInt(req.params.providerId, 10);
    if (Number.isNaN(providerId)) {
      return res.status(400).json({ success: false, error: "Invalid provider id" });
    }

    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    if (!provider) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }

    if (provider.isClaimed) {
      return res.status(409).json({ success: false, error: "This provider has already been claimed" });
    }

    const payload = providerClaimRequestSchema.parse(req.body) as ProviderClaimRequest;

    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72); // 72 hours

    const [claim] = await db
      .insert(providerClaims)
      .values({
        providerId,
        claimantName: payload.fullName,
        claimantEmail: payload.email,
        claimantPhone: payload.phone,
        relationship: payload.relationship,
        website: payload.website && payload.website.length ? payload.website : null,
        proofUrl: payload.proofUrl && payload.proofUrl.length ? payload.proofUrl : null,
        message: payload.message,
        franchiseId: payload.franchiseId ?? null,
        verificationToken,
        expiresAt,
      })
      .returning();

    const autoApprove = process.env.AUTO_APPROVE_PROVIDER_CLAIMS === "true";

    let franchiseName: string | undefined;
    if (payload.franchiseId) {
      const [franchise] = await db
        .select({ name: franchises.name })
        .from(franchises)
        .where(eq(franchises.id, payload.franchiseId))
        .limit(1);
      franchiseName = franchise?.name ?? undefined;
    }

    if (autoApprove) {
      await db
        .update(providers)
        .set({
          isClaimed: true,
          claimStatus: "approved",
          autoApproved: true,
        })
        .where(eq(providers.id, providerId));
    }

    try {
      await sendProviderClaimAdminNotification({
        provider,
        claim,
        autoApprove,
        franchiseName,
      });
      await sendProviderClaimantConfirmation({
        provider,
        claim,
        franchiseName,
      });
    } catch (emailError) {
      console.error("Failed to send claim notification emails", emailError);
    }

    res.json({ success: true, message: "Claim submitted" });
  } catch (error) {
    console.error("Provider claim error", error);
    res.status(500).json({ success: false, error: "Failed to submit claim" });
  }
});

export default router;
