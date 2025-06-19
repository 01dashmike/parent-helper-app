import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, CheckCircle, XCircle, Users, Star } from 'lucide-react';

interface BookingRequestItem {
  id: number;
  classId: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  bookingType: string;
  sessionsRequested: number;
  preferredDate: string;
  specialRequirements: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

export default function ProviderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestItem | null>(null);
  const [response, setResponse] = useState('');

  const { data: bookingRequests = [], isLoading } = useQuery({
    queryKey: ['/api/provider/booking-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/provider/booking-requests');
      return response.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action, response }: { id: number; action: string; response: string }) => {
      const res = await apiRequest('POST', `/api/booking-requests/${id}/respond`, {
        action,
        response,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.message,
        description: selectedRequest?.status === 'approved' ? 
          `Confirmation code: ${data.confirmationCode}` : 
          'The parent has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/provider/booking-requests'] });
      setSelectedRequest(null);
      setResponse('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to respond to booking request',
        variant: 'destructive',
      });
    },
  });

  const handleRespond = (action: 'approve' | 'decline') => {
    if (!selectedRequest) return;
    
    respondMutation.mutate({
      id: selectedRequest.id,
      action,
      response,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAge = (ageInMonths: number) => {
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months > 0 ? `${years} years ${months} months` : `${years} years`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
          <p className="text-gray-600">Manage your booking requests and confirmations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingRequests.filter((req: BookingRequestItem) => req.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingRequests.filter((req: BookingRequestItem) => 
                      req.status === 'approved' && 
                      new Date(req.createdAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{bookingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{bookingRequests
                      .filter((req: BookingRequestItem) => req.status === 'approved')
                      .reduce((sum: number, req: BookingRequestItem) => sum + Number(req.totalAmount), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingRequests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No booking requests yet</h3>
                <p className="text-gray-600">When parents request bookings, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((request: BookingRequestItem) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{request.parentName}</h3>
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            Child: {request.childName} ({formatAge(request.childAge)})
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Preferred: {formatDate(request.preferredDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {request.bookingType === 'block' ? 'Block Booking' : `${request.sessionsRequested} session${request.sessionsRequested > 1 ? 's' : ''}`}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {request.parentEmail}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {request.parentPhone}
                          </div>
                        </div>

                        {request.specialRequirements && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-blue-800">
                              <strong>Special Requirements:</strong> {request.specialRequirements}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-emerald-600">
                            Total: £{Number(request.totalAmount).toFixed(2)}
                          </span>
                          
                          {request.status === 'pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  onClick={() => setSelectedRequest(request)}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Respond to Request
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Respond to Booking Request</DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">Request Details</h4>
                                    <p><strong>Parent:</strong> {request.parentName}</p>
                                    <p><strong>Child:</strong> {request.childName} ({formatAge(request.childAge)})</p>
                                    <p><strong>Date:</strong> {formatDate(request.preferredDate)}</p>
                                    <p><strong>Total:</strong> £{Number(request.totalAmount).toFixed(2)}</p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Response Message (optional)
                                    </label>
                                    <Textarea
                                      value={response}
                                      onChange={(e) => setResponse(e.target.value)}
                                      placeholder="Add a personal message to the parent..."
                                      className="min-h-[100px]"
                                    />
                                  </div>

                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => handleRespond('approve')}
                                      disabled={respondMutation.isPending}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve & Confirm
                                    </Button>
                                    <Button
                                      onClick={() => handleRespond('decline')}
                                      disabled={respondMutation.isPending}
                                      variant="outline"
                                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}