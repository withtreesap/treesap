import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Collection } from "@treesap/types"

interface Props {
  collection: Collection
  items: any[]
}

interface Item {
  [key: string]: any
}

export default function ItemsList({ collection, items }: Props) {

  const fields = collection.fields;
  return (
    <div className="container mx-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-10">ID</TableHead>
            {fields.map((field) => (
              <TableHead key={field.name}>{field.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <a href={`/admin/collections/${collection.slug}/${item.id}`}>
                <TableCell>{item.id}</TableCell>
              </a>
              {fields.map((field) => (
                <TableCell key={field.name}>{item[field.name]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}