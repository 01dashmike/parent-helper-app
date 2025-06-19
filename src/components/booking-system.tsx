import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CreditCard, Phone, Mail, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

interface BookingProps {
  classItem: {
    id: number;
    name: string;
    venue: string;
    town: string;
    dayOfWeek: string;
    time: string;
    price: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    directBookingAvailable?: boolean;
    bookingEngineType?: string;
    bookingUrl?: string;
    bookingPhone?: string;
    bookingEmail?: string;
    onlinePaymentAccepted?: boolean;
    bookingAdvanceDays?: number;
    cancellationPolicy?: string;
    bookingNotes?: string;
  };
}

export function BookingSystem({ classItem }: BookingProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const getBookingType = () => {
    if (classItem.directBookingAvailable && classItem.bookingUrl) {
      return "direct";
    } else if (classItem.bookingPhone || classItem.contactPhone) {
      return "phone";
    } else if (classItem.bookingEmail || classItem.contactEmail) {
      return "email";
    }
    return "contact";
  };

  const bookingType = getBookingType();

  const handleDirectBooking = () => {
    if (classItem.bookingUrl) {
      window.open(classItem.bookingUrl, '_blank');
    } else if (classItem.website) {
      window.open(classItem.website, '_blank');
    }
  };

  const handlePhoneBooking = () => {
    const phone = classItem.bookingPhone || classItem.contactPhone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmailBooking = () => {
    const email = classItem.bookingEmail || classItem.contactEmail;
    const subject = `Booking Request: ${classItem.name}`;
    const body = `Hi,

I would like to book a place for the following class:
Class: ${classItem.name}
Venue: ${classItem.venue}, ${classItem.town}
Day/Time: ${classItem.dayOfWeek}s at ${classItem.time}

Child's Name: ${childName}
Child's Age: ${childAge}
Parent/Guardian: ${parentName}
Email: ${parentEmail}
Phone: ${parentPhone}

Special Requirements: ${specialRequests}

Please let me know about availability and next steps.

Thank you!`;

    if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Booking Status Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {classItem.directBookingAvailable ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Direct Booking Available
          </Badge>
        ) : (
          <Badge variant="outline" className="border-orange-200 text-orange-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Contact to Book
          </Badge>
        )}
        
        {classItem.onlinePaymentAccepted && (
          <Badge className="bg-blue-100 text-blue-800">
            <CreditCard className="h-3 w-3 mr-1" />
            Online Payment
          </Badge>
        )}
        
        {classItem.bookingAdvanceDays && (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Book {classItem.bookingAdvanceDays} days ahead
          </Badge>
        )}
      </div>

      {/* Booking Buttons */}
      <div className="flex gap-2 flex-wrap">
        {bookingType === "direct" && (
          <Button 
            onClick={handleDirectBooking}
            className="bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Book Online Now
          </Button>
        )}

        {bookingType === "phone" && (
          <Button 
            onClick={handlePhoneBooking}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call to Book
          </Button>
        )}

        {(bookingType === "email" || bookingType === "contact") && (
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Mail className="h-4 w-4 mr-2" />
                Send Booking Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Book: {classItem.name}</DialogTitle>
                <DialogDescription>
                  {classItem.venue}, {classItem.town} • {classItem.dayOfWeek}s at {classItem.time}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childName">Child's Name</Label>
                    <Input
                      id="childName"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childAge">Child's Age</Label>
                    <Input
                      id="childAge"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      placeholder="e.g. 18 months"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parentName">Parent/Guardian Name</Label>
                  <Input
                    id="parentName"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmail">Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPhone">Phone</Label>
                    <Input
                      id="parentPhone"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requirements</Label>
                  <Textarea
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requirements or questions..."
                    rows={3}
                  />
                </div>

                {classItem.cancellationPolicy && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <strong>Cancellation Policy:</strong> {classItem.cancellationPolicy}
                  </div>
                )}

                {classItem.bookingNotes && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                    <strong>Booking Notes:</strong> {classItem.bookingNotes}
                  </div>
                )}

                <Button 
                  onClick={handleEmailBooking}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!parentName || !parentEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Booking Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Booking Information */}
      {(classItem.bookingNotes || classItem.cancellationPolicy) && (
        <Card className="mt-3">
          <CardContent className="p-4">
            {classItem.bookingNotes && (
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Booking Information:</p>
                <p className="text-sm text-gray-600">{classItem.bookingNotes}</p>
              </div>
            )}
            {classItem.cancellationPolicy && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Cancellation Policy:</p>
                <p className="text-sm text-gray-600">{classItem.cancellationPolicy}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}