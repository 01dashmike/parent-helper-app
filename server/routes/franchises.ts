import express from "express";
import crypto from "node:crypto";
import { eq, ilike, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  franchises,
  insertFranchiseSchema,
  providerFranchises,
  providers,
  franchiseDiscountCodes,
  insertFranchiseDiscountCodeSchema,
  franchiseInvites,
  type Franchise,
} from "@shared/schema";
import {
  sendFranchiseInviteEmail,
} from "../email-service.js";
import { z } from "zod";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: any = null;
try {
  if (stripeSecretKey) {
    const Stripe = (await import("stripe")).default;
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
  }
} catch (error) {
  console.warn("Stripe SDK unavailable, discount creation will skip Stripe", error);
}

const stripeDiscountsEnabled =
  process.env.ENABLE_STRIPE_DISCOUNTS === "true" && Boolean(stripe);

function generateCode(prefix: string = "PHFR") {
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const router = express.Router();

function assertAdmin(req: express.Request, res: express.Response): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return true; // no key configured, allow (development mode)
  }

  if (req.headers["x-admin-key"] !== adminKey) {
    res.status(403).json({ success: false, error: "Admin key required" });
    return false;
  }
  return true;
}

router.get("/api/franchises", async (req, res) => {
  try {
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 50;
    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";

    let rows: Franchise[];
    if (search) {
      const pattern = `%${search}%`;
      rows = await db
        .select()
        .from(franchises)
        .where(ilike(franchises.name, pattern))
        .limit(limit)
        .orderBy(franchises.name);
    } else {
      rows = await db.select().from(franchises).limit(limit).orderBy(franchises.name);
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Franchise list failed", error);
    res.status(500).json({ success: false, error: "Failed to load franchises" });
  }
});

router.post("/api/franchises", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const payload = insertFranchiseSchema.parse(req.body);
    const [row] = await db.insert(franchises).values(payload).returning();
    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Create franchise failed", error);
    res.status(500).json({ success: false, error: "Unable to create franchise" });
  }
});

router.patch("/api/franchises/:id", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(franchiseId)) {
      return res.status(400).json({ success: false, error: "Invalid franchise id" });
    }

    const payload = insertFranchiseSchema.partial().parse(req.body);
    const [row] = await db
      .update(franchises)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(franchises.id, franchiseId))
      .returning();

    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Update franchise failed", error);
    res.status(500).json({ success: false, error: "Unable to update franchise" });
  }
});

router.get("/api/franchises/:id/providers", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(franchiseId)) {
      return res.status(400).json({ success: false, error: "Invalid franchise id" });
    }

    const rows = await db
      .select({
        providerId: providers.id,
        providerName: providers.name,
        town: providers.town,
        postcode: providers.postcode,
        slug: providers.slug,
      })
      .from(providerFranchises)
      .innerJoin(providers, eq(providerFranchises.providerId, providers.id))
      .where(eq(providerFranchises.franchiseId, franchiseId));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("List franchise providers failed", error);
    res.status(500).json({ success: false, error: "Unable to load franchise providers" });
  }
});

router.post("/api/franchises/:id/providers", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    const providerId = Number.parseInt(String(req.body?.providerId), 10);

    if (Number.isNaN(franchiseId) || Number.isNaN(providerId)) {
      return res.status(400).json({ success: false, error: "Invalid ids" });
    }

    const providerExists = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    if (!providerExists.length) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }

    const [row] = await db
      .insert(providerFranchises)
      .values({ providerId, franchiseId })
      .onConflictDoNothing()
      .returning();

    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Attach provider to franchise failed", error);
    res.status(500).json({ success: false, error: "Could not attach provider" });
  }
});

router.delete("/api/franchises/:id/providers/:providerId", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    const providerId = Number.parseInt(req.params.providerId, 10);
    if (Number.isNaN(franchiseId) || Number.isNaN(providerId)) {
      return res.status(400).json({ success: false, error: "Invalid ids" });
    }

    await db
      .delete(providerFranchises)
      .where(
        and(
          eq(providerFranchises.franchiseId, franchiseId),
          eq(providerFranchises.providerId, providerId),
        ),
      );

    res.json({ success: true });
  } catch (error) {
    console.error("Detach provider from franchise failed", error);
    res.status(500).json({ success: false, error: "Could not detach provider" });
  }
});

router.get("/api/franchises/:id/discount-codes", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(franchiseId)) {
      return res.status(400).json({ success: false, error: "Invalid franchise id" });
    }

    const rows = await db
      .select()
      .from(franchiseDiscountCodes)
      .where(eq(franchiseDiscountCodes.franchiseId, franchiseId))
      .orderBy(franchiseDiscountCodes.createdAt);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Load discount codes failed", error);
    res.status(500).json({ success: false, error: "Unable to load discount codes" });
  }
});

router.post("/api/franchises/:id/discount-codes", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(franchiseId)) {
      return res.status(400).json({ success: false, error: "Invalid franchise id" });
    }

    const schema = insertFranchiseDiscountCodeSchema.extend({
      code: insertFranchiseDiscountCodeSchema.shape.code.optional(),
    });

    const payload = schema.parse({ ...req.body, franchiseId });

    const code = (payload.code || generateCode()).toUpperCase();

    let stripeCouponId: string | undefined;
    let stripePromotionId: string | undefined;

    if (stripeDiscountsEnabled) {
      try {
        const coupon = await stripe.coupons.create({
          percent_off: Number(payload.discountPercent) || 10,
          duration: "repeating",
          duration_in_months: 12,
          max_redemptions: payload.maxRedemptions ?? undefined,
        });
        stripeCouponId = coupon.id;
        const promotion = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code,
        });
        stripePromotionId = promotion.id;
      } catch (stripeError) {
        console.error("Stripe coupon creation failed", stripeError);
      }
    }

    const [row] = await db
      .insert(franchiseDiscountCodes)
      .values({
        franchiseId,
        code,
        description: payload.description,
        discountPercent: payload.discountPercent,
        maxRedemptions: payload.maxRedemptions,
        expiresAt: payload.expiresAt,
        createdByUserId: payload.createdByUserId,
        stripeCouponId,
        stripePromotionId,
      })
      .returning();

    res.json({ success: true, data: row, stripe: stripeDiscountsEnabled });
  } catch (error) {
    console.error("Create discount code failed", error);
    res.status(500).json({ success: false, error: "Unable to create discount code" });
  }
});

router.post("/api/franchises/:id/invites", async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const franchiseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(franchiseId)) {
      return res.status(400).json({ success: false, error: "Invalid franchise id" });
    }

    const inviteSchema = z.object({
      emails: z.array(z.string().email()).nonempty(),
      inviteType: z.string().optional(),
      code: z.string().optional(),
      sourceCampaign: z.string().optional(),
      metadata: z.any().optional(),
    });

    const raw = inviteSchema.parse(req.body);

    const signupBase = process.env.FRANCHISE_SIGNUP_BASE_URL || "https://parenthelper.co.uk/provider/signup";

    const results: Array<{ email: string; status: string }> = [];
    for (const email of raw.emails) {
      const inviteCode = raw.code || generateCode("INVITE");

      const [invite] = await db
        .insert(franchiseInvites)
        .values({
          franchiseId,
          inviteType: raw.inviteType ?? "email",
          email,
          code: inviteCode,
          sourceCampaign: raw.sourceCampaign,
          metadata: raw.metadata,
        })
        .returning();

      try {
        await sendFranchiseInviteEmail({
          email,
          invite,
          signupUrl: `${signupBase}?code=${encodeURIComponent(inviteCode)}`,
        });
        results.push({ email, status: "sent" });
      } catch (sendError) {
        console.error("Failed to send franchise invite", sendError);
        results.push({ email, status: "error" });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Franchise invite failed", error);
    res.status(500).json({ success: false, error: "Unable to send invites" });
  }
});

export default router;
