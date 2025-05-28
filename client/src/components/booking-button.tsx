import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookingForm } from './booking-form';
import { Calendar, Clock, Users } from 'lucide-react';
import type { Class } from '@shared/schema';

interface BookingButtonProps {
  classItem: Class;
}

export function BookingButton({ classItem }: BookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show booking button if booking is not enabled
  if (!classItem.bookingEnabled) {
    return null;
  }

  const isInstantBooking = classItem.bookingType === 'instant';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {isInstantBooking ? 'Book Now' : 'Check Availability'}
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
            
            {classItem.bookingPrice && (
              <div className="mt-3 text-lg font-semibold text-emerald-700">
                Single Session: £{Number(classItem.bookingPrice).toFixed(2)}
                {classItem.blockBookingAvailable && classItem.blockBookingPrice && (
                  <span className="ml-4 text-base font-normal text-gray-600">
                    Block of {classItem.blockBookingSessions}: £{Number(classItem.blockBookingPrice).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>

          {!isInstantBooking && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Quick Check Process:</strong> We'll send your details to the provider who will confirm availability and get back to you within 2 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <BookingForm 
          classItem={classItem} 
          onSuccess={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}