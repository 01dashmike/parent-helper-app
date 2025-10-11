import express from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = express.Router();

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { classId, providerId } = req.body;

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: process.env.STRIPE_FEATURED_PRICE_ID,
                quantity: 1,
            }],
            metadata: {
                classId: classId.toString(),
                providerId: providerId.toString(),
            },
            success_url: `${req.headers.origin}/provider-dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/provider-dashboard`,
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']!;

    try {
        // const event = stripe.
