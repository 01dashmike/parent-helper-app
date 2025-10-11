import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Eye, Calendar, Crown, Edit, TrendingUp } from 'lucide-react';
import { UpgradeToFeatured } from '@/components/upgrade-to-featured';

export default function ProviderDashboard() {
    const { data: providerClasses = [] } = useQuery({
        queryKey: ['/api/provider/classes'],
    });

    const { data: analytics } = useQuery({
        queryKey: ['/api/provider/analytics'],
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Provider Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Manage your listings and view performance analytics
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Views</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics?.totalViews || 0}
                                    </p>
                                </div>
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                                +{analytics?.viewsChange || 0}% vs last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Bookings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics?.totalBookings || 0}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                                +{analytics?.bookingsChange || 0}% vs last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Listings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {providerClasses.length}
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        £{analytics?.totalRevenue || 0}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="listings" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="listings">My Listings</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
                    </TabsList>

                    <TabsContent value="listings">
                        <div className="grid gap-6">
                            {providerClasses.map((classItem: any) => (
                                <Card key={classItem.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>{classItem.name}</CardTitle>
                                                <p className="text-sm text-gray-600">{classItem.venue}</p>
                                            </div>
                                            {classItem.isFeatured && (
                                                <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center">
                                                    <Crown className="w-4 h-4 mr-1" />
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-6 text-sm text-gray-600">
                                                <span><Eye className="w-4 h-4 inline mr-1" />{classItem.views || 0} views</span>
                                                <span><Calendar className="w-4 h-4 inline mr-1" />{classItem.bookings || 0} bookings</span>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Listing
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Detailed analytics coming soon! Track views, bookings, and revenue trends.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="upgrade">
                        {providerClasses.filter((c: any) => !c.isFeatured).map((classItem: any) => (
                            <UpgradeToFeatured key={classItem.id} classId={classItem.id} />
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}