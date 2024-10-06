import React, { useState, useEffect } from 'react'
import type { Field, Collection } from "@treesap/types"
import TextField from './fields/text-field'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ulid } from '@std/ulid'

interface CmsFormProps {
  collection: Collection
  item?: Record<string, string>;
}

export default function CmsForm({ collection, item }: CmsFormProps) {
  const [open, setOpen] = useState(true)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData(item || {})
  }, [item])

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = { ...formData };

    if (!data.id) {
      data.id = ulid();
    }

    if (item) {
    }

    const res = await fetch(`/api/collections/${collection.slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: collection.slug,
        id: data.id,
        data,
      }),
    });

    if (!res.ok) {
      console.error('Failed to submit form:', res.statusText);
    } else {
      console.log('Form submitted successfully:', await res.json());
    }
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          {collection.fields.map(field => (
            <TextField
              key={field.name}
              model={field}
              onChange={handleChange}
              value={formData[field.name] || ''}
            />
          ))}
        </div>
        
      </form>
    </div>
  )
}
