import React from 'react';
import { getClasses } from '../../../src/lib/classesService';
import { notFound } from 'next/navigation';

// Define the correct Props type
export type Props = {
  params: {
    slug?: string[];
  };
};

export async function generateMetadata({ params }: Props) {
  const [town, category] = params.slug ?? [];
  const title = category
    ? `Best ${category} Classes in ${town}`
    : `Baby & Toddler Classes in ${town}`;
  const description = `Explore top-rated classes for families in ${town}${category ? `, including ${category} options` : ''}.`;

  return { title, description };
}

export default async function ClassListPage({ params }: Props) {
  const [town, category] = params.slug ?? [];
  const classes = await getClasses({ town, category });

  if (!classes?.length) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        {category ? `${category} Classes in ${town}` : `All Classes in ${town}`}
      </h1>
      <ul className="space-y-4">
        {classes.map((cls) => (
          <li key={cls.id} className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{cls.name}</h2>
            <p className="text-gray-600">{cls.description}</p>
            <p className="text-sm text-gray-500">{cls.venue} — {cls.day_of_week}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 