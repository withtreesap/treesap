import { useState, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Upload } from "lucide-react"
import type { Field } from "@treesap/types"

interface ImageUploadProps {
  model: Field
  onChange?: (file: File | null) => void
}

export default function ImageUpload({ model, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    onChange?.(file)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    controls.start({ scale: 1.05, transition: { duration: 0.2 } })
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    controls.start({ scale: 1, transition: { duration: 0.2 } })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    controls.start({ scale: 1, transition: { duration: 0.2 } })

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    } else {
      alert('Please drop an image file.')
    }
  }

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onChange?.(null)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={model.name}>{model.label}</Label>
      <div className="relative">
        <motion.div
          ref={dropZoneRef}
          animate={controls}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
          }`}
          style={{ minHeight: '200px' }}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-w-full h-auto max-h-48 rounded-lg" />
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Drag and drop an image here, or click to select</p>
            </div>
          )}
          <input
            type="file"
            id="image"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button onClick={handleButtonClick} variant="outline">
            {preview ? 'Change Image' : 'Select Image'}
          </Button>
          {fileName && <p className="text-sm text-gray-500">{fileName}</p>}
        </motion.div>
        {preview && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -top-2 -right-2 bg-black hover:bg-gray-800 text-white rounded-full shadow-md"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear image</span>
          </Button>
        )}
      </div>
    </div>
  )
}