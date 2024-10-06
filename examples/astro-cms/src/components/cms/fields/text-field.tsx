import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Field } from "@treesap/types"

interface TextFieldProps {
  model: Field
  onChange?: (name: string, value: string) => void
  value: string
}

export default function TextField({ model, onChange, value }: TextFieldProps) {


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(model.name, e.target.value)
  }

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={model.name}>{model.label}</Label>
      <Input
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