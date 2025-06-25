import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClasses } from "../../../src/lib/classesService";

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const [town, category] = slug ?? [];
  return {
    title: town ? `Baby & Toddler Classes in ${town}` : "Baby & Toddler Classes",
    description: category && town
      ? `Explore ${category} classes in ${town} for babies and toddlers.`
      : "Explore classes for babies and toddlers.",
  };
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const [town, category] = slug ?? [];

  const classes = await getClasses({ town, category });

  if (!classes?.length) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        Classes{town ? ` in ${town}` : ""}
      </h1>
      <ul className="space-y-4">
        {classes.map((cls: any) => (
          <li key={cls.id} className="border p-4 rounded shadow">
            <p className="font-semibold">{cls.class_name}</p>
            <p className="text-sm text-gray-600">{cls.venue}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 