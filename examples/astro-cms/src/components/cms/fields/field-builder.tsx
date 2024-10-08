import React from 'react';
import type { Field } from "@treesap/types";
import TextField from './text-field';
import TextareaField from './textarea-field';
import SlugField from './slug-field';
import MarkdownField from './markdown-field';
import ImageField from './image-field';


interface FieldBuilderProps {
  fields: Field[];
  formData: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, formData, onChange }) => {
  return (
    <>
      {fields.map(field => {
        switch (field.type) {
          case 'text':
            return (
              <TextField
                key={field.name}
                model={field}
                onChange={onChange}
                value={formData[field.name] || ''}
              />
            );
          case 'textarea':
            return (
              <TextareaField
                key={field.name}
                model={field}
                onChange={onChange}
                value={formData[field.name] || ''}
              />
            );
          case 'slug':
            return (
              <SlugField
                key={field.name}
                model={field}
                onChange={onChange}
                value={formData[field.name] || ''}
              />
            );
          case 'markdown':
            return (
              <MarkdownField
                key={field.name}
                model={field}
                onChange={onChange}
                value={formData[field.name] || ''}
              />
            );
          case 'image':
            return (
              <ImageField
                key={field.name}
                model={field}
                onChange={onChange}
                value={formData[field.name] || ''}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default FieldBuilder;
