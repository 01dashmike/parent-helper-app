import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Crown, Mail, Phone, Building } from 'lucide-react';

export function ClaimListingDialog({ classItem }: { classItem: any }) {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');
    const { toast } = useToast();

    const handleClaim = async () => {
        try {
            const response = await fetch('/api/claim-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: classItem.id,
                    email,
                    phone,
                    businessName
                })
            });

            if (response.ok) {
                toast({
                    title: "Claim request sent!",
                    description: "We'll verify your details and email you login credentials within 24 hours."
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit claim. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-200">
                    <Crown className="w-4 h-4 mr-2" />
                    Claim This Listing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Claim Your Business Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>What you'll get:</strong>
                            <ul className="mt-2 space-y-1">
                                <li>✓ Edit your class details</li>
                                <li>✓ Add photos & Instagram</li>
                                <li>✓ See booking analytics</li>
                                <li>✓ Respond to reviews</li>
                            </ul>
                        </p>
                    </div>

                    <div>
                        <Label>Business Name</Label>
                        <Input
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Your business name"
                        />
                    </div>

                    <div>
                        <Label>Business Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@business.com"
                        />
                    </div>

                    <div>
                        <Label>Phone Number</Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="07xxx xxx xxx"
                        />
                    </div>

                    <Button
                        onClick={handleClaim}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!email || !phone || !businessName}
                    >
                        Submit Claim Request
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        We'll verify your business details and send login credentials within 24 hours
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}