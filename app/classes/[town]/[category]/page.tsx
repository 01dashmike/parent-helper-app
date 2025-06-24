import React from 'react';
import { getClasses } from '../../../../src/lib/classesService';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { town: string; category: string } }): Promise<Metadata> {
  const town = decodeURIComponent(params.town);
  const category = decodeURIComponent(params.category);
  return {
    title: `${category} Classes in ${town} | Parent Helper`,
    description: `Discover the best ${category.toLowerCase()} classes in ${town}. Updated listings for babies, toddlers, and preschoolers.`,
  };
}

export default async function ClassesByTownCategoryPage({
  params,
}: {
  params: { town: string; category: string };
}) {
  const town = decodeURIComponent(params.town);
  const category = decodeURIComponent(params.category);

  const response = await getClasses({ town, category });
  if (!response.success || !response.data.length) return notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{category} Classes in {town}</h1>
      <p className="text-gray-600 mb-6">Browse the latest {category.toLowerCase()} classes in {town}, updated regularly.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {response.data.map((cls) => (
          <div key={cls.id} className="p-4 border rounded-2xl shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-1">{cls.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{cls.location}</p>
            <p className="text-sm mb-3 line-clamp-3">{cls.description}</p>
            <Link
              href={`/class/${cls.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View details
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
} 