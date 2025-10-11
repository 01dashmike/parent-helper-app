import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import CoverageMap from '@/components/coverage-map';
import ClassCard from '@/components/class-card';
import type { Class } from '@shared/schema';

export default function TownPage() {
    const { town } = useParams();
    const [localContext, setLocalContext] = useState<any>(null);

    const { data: classes = [], isLoading } = useQuery<Class[]>({
        queryKey: [`/api/classes/town/${town}`],
        queryFn: async () => {
            const res = await fetch(`/api/classes/town/${town}`);
            if (!res.ok) {
                throw new Error('Failed to fetch');
            }
            return res.json();
        },
        enabled: Boolean(town),
    });

    useEffect(() => {
        fetch(`/api/local-context/${town}`)
            .then(r => r.json())
            .then(setLocalContext)
            .catch(console.error);
    }, [town]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading classes...</div>
            </div>
        );
    }

    if (classes.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">
                    No classes yet in {town}
                </h1>
                <p className="text-gray-600">Check back soon or search nearby towns.</p>
            </div>
        );
    }

    const townCapitalized = town.charAt(0).toUpperCase() + town.slice(1);

    return (
        <div className="min-h-screen bg-gray-50">
            <div
                className="h-96 bg-cover bg-center relative"
                style={{
                    backgroundImage: `url(https://source.unsplash.com/1600x900/?${town},uk,town)`
                }}
            >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center text-white">
                    <h1 className="text-5xl font-bold mb-4">
                        Baby & Toddler Classes in {townCapitalized}
                    </h1>
                    <p className="text-xl">
                        {classes.length} classes available now
                    </p>
                </div>
            </div>

            <div className="bg-white border-b py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-coral">{classes.length}</div>
                            <div className="text-gray-600">Active Classes</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-sage">
                                {localContext?.venues || '...'}
                            </div>
                            <div className="text-gray-600">Local Venues</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-lavender">
                                {localContext?.parkingSpots || '...'}
                            </div>
                            <div className="text-gray-600">With Parking</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="sticky top-4">
                            <CoverageMap classes={classes} fullScreen={false} />

                            {localContext?.transport && (
                                <div className="mt-4 bg-white p-4 rounded-lg shadow">
                                    <h3 className="font-semibold mb-2">Getting Around</h3>
                                    <p className="text-sm text-gray-600">{localContext.transport}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-2xl font-bold">All Classes</h2>
                        {classes.map(classItem => (
                            <ClassCard key={classItem.id} classItem={classItem} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
