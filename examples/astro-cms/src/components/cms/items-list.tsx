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

  const fields = collection.fields.slice(0, 3);
  const maxLength = 70; 

  const trimWord = (word: string) => {
    if (word.length > maxLength) {
      return word.substring(0, maxLength) + '...';
    }
    return word;
  }

  return (
    <div className="container mx-auto">
      <Table className="table-auto">
        <TableHeader className="bg-gray-50 sticky top-0">
          <TableRow>
            <TableHead className="w-10">ID</TableHead>
            {fields.map((field) => (
              <TableHead key={field.name}>{trimWord(field.label)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell key={item.id}>
                <a className="hover:underline" href={`/admin/collections/${collection.slug}/${item.id}`}>
                  {item.id}
                </a>
              </TableCell>
              {fields.map((field) => (
                <TableCell className="whitespace-nowrap" key={field.name}>{trimWord(item[field.name])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}