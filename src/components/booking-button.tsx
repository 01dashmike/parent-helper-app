import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Users, CreditCard } from "lucide-react";
import type { Class } from "@shared/schema";

const BOOKING_FEE_GBP = Number(import.meta.env.VITE_BOOKING_FEE_GBP ?? "1");
const STRIPE_PERCENT_FEE = Number(import.meta.env.VITE_STRIPE_PERCENT_FEE ?? "1.4") / 100;
const STRIPE_FIXED_FEE = Number(import.meta.env.VITE_STRIPE_FIXED_FEE ?? "0.20");

interface BookingButtonProps {
  classItem: Class;
}

export function BookingButton({ classItem }: BookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show booking button if booking is not enabled
  if (!classItem.bookingEnabled) {
    return null;
  }

  const isInstantBooking = classItem.bookingType === "instant";

  const pricing = useMemo(() => {
    const baseRaw =
      (classItem.bookingPrice ?? classItem.pricePerSession ?? classItem.price ?? "0").toString();
    const base = Number(baseRaw);
    if (!Number.isFinite(base) || base <= 0) {
      return null;
    }
    const bookingFee = BOOKING_FEE_GBP;
    const stripeFee = Number((base * STRIPE_PERCENT_FEE + STRIPE_FIXED_FEE).toFixed(2));
    const total = Number((base + bookingFee + stripeFee).toFixed(2));
    return { base, bookingFee, stripeFee, total };
  }, [classItem.bookingPrice, classItem.pricePerSession, classItem.price]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {isInstantBooking ? "Book Now" : "Check Availability"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            {isInstantBooking ? 'Book Your Session' : 'Check Availability'}
          </DialogTitle>
          
          {/* Class details preview */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{classItem.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                {classItem.dayOfWeek} at {classItem.time}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-emerald-600" />
                Ages {Math.floor(classItem.ageGroupMin / 12)}-{Math.floor(classItem.ageGroupMax / 12)} years
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                {classItem.venue}
              </div>
            </div>
            
            {pricing ? (
              <div className="mt-4 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Class price</span>
                  <span>£{pricing.base.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Booking fee</span>
                  <span>£{pricing.bookingFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Estimated card fee</span>
                  <span>£{pricing.stripeFee.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-lg font-semibold text-emerald-700">
                  <span>Total today</span>
                  <span>£{pricing.total.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Fees are calculated automatically. Stripe fixed fee and percentage can be adjusted via environment
                  variables when payments go live.
                </p>
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-600">
                This class currently has no price listed. Contact the provider to book directly.
              </div>
            )}
          </div>

          {!isInstantBooking && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Quick Check Process:</strong> We'll send your details to the provider who will confirm
                    availability and get back to you within 2 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="p-4 space-y-3">
          {pricing ? (
            <>
              <p className="text-sm text-gray-600">
                Secure checkout is being finalised. You'll soon be able to pay the total above and guarantee your place in
                seconds. For now, complete the quick enquiry form on the next step and we'll confirm availability.
              </p>
              <Button className="w-full" disabled>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay £{pricing.total.toFixed(2)} (coming soon)
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Pricing isn't available yet. Reach out to the provider using the contact buttons on this page.
            </p>
          )}
          <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
