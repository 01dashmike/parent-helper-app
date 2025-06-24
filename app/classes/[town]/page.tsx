'use client'

import React, { useEffect, useState } from 'react'

export default function TownClassesPage({ params }: { params: { town: string } }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`/api/classes?town=${params.town}`)
        const json = await res.json()
        setClasses(json.data || [])
      } catch (err) {
        console.error('Error fetching classes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [params.town])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold capitalize mb-6">
        Classes in {params.town.replace(/-/g, ' ')}
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-gray-500">No classes found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((c: any) => (
            <li key={c.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">{c.name}</h2>
              <p className="text-sm text-gray-600">{c.description}</p>
              <p className="text-sm mt-1 text-gray-400">Location: {c.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 