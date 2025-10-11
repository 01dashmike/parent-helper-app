import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function UpgradeToFeatured({ classId }: { classId: number }) {
    const { toast } = useToast();

    const handleUpgrade = async () => {
        const stripe = await stripePromise;
        if (!stripe) return;

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId,
                    priceId: 'price_featured_listing', // Create in Stripe Dashboard
                })
            });

            const { sessionId } = await response.json();
            await stripe.redirectToCheckout({ sessionId });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start checkout. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 rounded-lg">
                    <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Upgrade to Featured
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Get 3x more visibility and bookings
                    </p>
                    <ul className="space-y-2 mb-6">
                        {[
                            'Appear at top of search results',
                            'Gold badge highlighting',
                            'Priority in email notifications',
                            'Featured in social media posts',
                            'Monthly analytics report'
                        ].map((benefit, i) => (
                            <li key={i} className="flex items-center text-sm">
                                <Check className="w-4 h-4 text-green-600 mr-2" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-gray-900">£10</span>
                        <span className="text-gray-600">/month per location</span>
                    </div>
                    <Button
                        onClick={handleUpgrade}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                    >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now
                    </Button>
                </div>
            </div>
        </div>
    );
}