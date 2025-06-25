import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { bookingFormSchema } from '@shared/schema';
import type { Class } from '@shared/schema';
import { Calendar, CreditCard, MessageSquare, Phone, User, Users } from 'lucide-react';

interface BookingFormProps {
  classItem: Class;
  onSuccess: () => void;
}

export function BookingForm({ classItem, onSuccess }: BookingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentWhatsapp: '',
      childName: '',
      childAge: 12, // Default to 1 year old
      bookingType: 'single' as const,
      sessionsRequested: 1,
      preferredDate: '',
      specialRequirements: '',
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/booking-requests', {
        ...data,
        classId: classItem.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: classItem.bookingType === 'instant' ? 'Booking Confirmed!' : 'Availability Check Sent!',
        description: classItem.bookingType === 'instant' 
          ? `Your booking has been confirmed. Confirmation code: ${data.confirmationCode}`
          : 'We\'ve sent your request to the provider. You\'ll hear back within 2 hours.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createBookingMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookingType = form.watch('bookingType');
  const sessionsRequested = form.watch('sessionsRequested');

  // Calculate total price
  const calculateTotal = () => {
    if (!classItem.bookingPrice) return 0;
    
    if (bookingType === 'block' && classItem.blockBookingAvailable && classItem.blockBookingPrice) {
      return Number(classItem.blockBookingPrice);
    }
    
    return Number(classItem.bookingPrice) * sessionsRequested;
  };

  const isInstantBooking = classItem.bookingType === 'instant';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Parent Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-emerald-600" />
            Parent Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="07xxx xxx xxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="07xxx xxx xxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Child Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Child Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="childName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child's Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter child's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="childAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child's Age (in months) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="180" 
                      placeholder="12" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
            Booking Details
          </h3>

          <div className="space-y-4">
            {/* Booking Type */}
            {classItem.blockBookingAvailable && (
              <FormField
                control={form.control}
                name="bookingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <Label htmlFor="single" className="flex-1 cursor-pointer">
                            Single Session - £{Number(classItem.bookingPrice || 0).toFixed(2)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="block" id="block" />
                          <Label htmlFor="block" className="flex-1 cursor-pointer">
                            Block Booking ({classItem.blockBookingSessions} sessions) - £{Number(classItem.blockBookingPrice || 0).toFixed(2)}
                            <span className="text-sm text-green-600 ml-2">Save £{((Number(classItem.bookingPrice || 0) * (classItem.blockBookingSessions || 1)) - Number(classItem.blockBookingPrice || 0)).toFixed(2)}</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sessions for single booking */}
            {bookingType === 'single' && (
              <FormField
                control={form.control}
                name="sessionsRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Sessions</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of sessions" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1,2,3,4,5].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} session{num > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements or Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special requirements, dietary needs, or questions..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Cost:</span>
            <span className="text-purple-700">£{calculateTotal().toFixed(2)}</span>
          </div>
          {isInstantBooking && (
            <p className="text-sm text-gray-600 mt-2">
              Payment will be processed securely after confirmation
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center">
              {isInstantBooking ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Booking & Pay
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Availability Check
                </>
              )}
            </div>
          )}
        </Button>

        {!isInstantBooking && (
          <div className="text-center text-sm text-gray-600">
            <Phone className="w-4 h-4 inline mr-1" />
            The provider will contact you within 2 hours to confirm availability
          </div>
        )}
      </form>
    </Form>
  );
}