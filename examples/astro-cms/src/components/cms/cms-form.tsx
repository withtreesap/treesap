import React, { useState, useEffect } from 'react'
import type { Field, Collection } from "@treesap/types"
import TextField from './fields/text-field'
import TextareaField from './fields/textarea-field'
import FieldBuilder from './fields/field-builder'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"
interface CmsFormProps {
  global?: Global;
  collection?: Collection;
  item?: Record<string, string>;
}

export default function CmsForm({ global, collection, item }: CmsFormProps) {
  
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      setFormData({})
    }
  }, [item, collection, global])

  const fields = collection ? collection.fields : global.fields;

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }


  const buildUrl = ({
    global,
    collection,
    id,
  }: {
    global?: Global;
    collection?: Collection;
    id?: string;
  }) => {
    let url = '/api';

    if (global) {
      url += `/globals/${global.slug}/item`;
    } else if (collection) {
      url += `/collections/${collection.slug}`;
    }

    if (id) {
      url += `/${id}`;
    }

    console.log('url', url);
    return url;
  }


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    
    e?.preventDefault();

    const data = formData;

    const editing = !!item;

    const url = buildUrl({
      global,
      collection,
      id: item?.id,
    });

    const res = await fetch(url, {
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
      // if (editing == false) {
      //   window.location.href = `/admin/collections/${collection.slug}`;
      // }
    }
  }

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (!item) {
      return; 
    }

    const url = buildUrl({
      collection,
      id: item.id,
    });

    console.log('url', url);

    const res = await fetch(url, { method: 'DELETE' });

    if (!res.ok) {
      console.error('Failed to delete item:', res.statusText);
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted successfully');
      window.location.href = `/admin/collections/${collection.slug}`;
    }
  }

  

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-end mb-4 gap-2">
          {item && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
        <div className="flex flex-col gap-4">
          <FieldBuilder
            fields={fields}
            formData={formData}
            onChange={handleChange}
          />
        </div>
      </form>
    </div>
  )
}
