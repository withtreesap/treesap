import React, { useState, useEffect } from 'react'
import type { Field, Collection } from "@treesap/types"
import TextField from './fields/text-field'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ulid } from '@std/ulid'
import { toast } from "sonner"


interface CmsFormProps {
  collection: Collection
  item?: Record<string, string>;
}

export default function CmsForm({ collection, item }: CmsFormProps) {
  
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      setFormData({})
    }
  }, [item, collection])

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const data = formData;

    const editing = !!item;

    const res = await fetch(`/api/collections/${collection.slug}${editing ? `/${data.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.error('Failed to submit form:', res.statusText);
    } else {
      toast.success('Saved');
      if (editing) {
        window.location.reload();
      } else {
        window.location.href = `/admin/collections/${collection.slug}`;
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-end mb-4">
          <Button type="submit">
            Save
          </Button>
        </div>
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
