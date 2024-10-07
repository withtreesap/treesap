import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Field } from "@treesap/types"

interface SlugFieldProps   {
  model: Field
  onChange?: (name: string, value: string) => void
  value: string
}

export default function SlugField({ model, onChange, value }: SlugFieldProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'); // Only replace non-alphanumeric characters with a single dash
    onChange(model.name, slug)
  }

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={model.name}>{model.label}</Label>
      <Input
        className="w-full"
        type="text"
        id={model.name}
        name={model.name}
        value={value}
        onChange={handleChange}
        placeholder={`Enter ${model.label.toLowerCase()}`}
      />
      <p className="text-sm pt-1 text-gray-500">https://example.com/{value}</p>
    </div>
  )
}