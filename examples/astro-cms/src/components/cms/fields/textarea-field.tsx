import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Field } from "@treesap/types"

interface TextareaFieldProps {
  model: Field
  onChange?: (name: string, value: string) => void
  value: string
}

export default function TextareaField({ model, onChange, value }: TextareaFieldProps) {


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(model.name, e.target.value)
  }

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={model.name}>{model.label}</Label>
      <Textarea
        className="w-full"
        type={model.type === 'string' ? 'text' : model.type}
        id={model.name}
        name={model.name}
        value={value}
        onChange={handleChange}
        placeholder={`Enter ${model.label.toLowerCase()}`}
      />
    </div>
  )
}