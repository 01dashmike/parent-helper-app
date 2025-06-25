import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';
import { getClasses } from '../../../src/lib/classesService';

type PageProps = {
  params: {
    slug: string[];
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [town, category] = params.slug;
  return {
    title: `Baby & Toddler Classes in ${town}`,
    description: `Explore ${category} classes in ${town} for babies and toddlers.`,
  };
}

export default async function ClassesPage({ params }: PageProps) {
  const [town, category] = params.slug;
  const classes = await getClasses({ town, category });

  if (!classes.length) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Classes in {town}</h1>
      <ul className="space-y-4">
        {classes.map((cls) => (
          <li key={cls.id} className="border p-4 rounded shadow">
            <p className="font-semibold">{cls.class_name}</p>
            <p className="text-sm text-gray-600">{cls.venue}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 