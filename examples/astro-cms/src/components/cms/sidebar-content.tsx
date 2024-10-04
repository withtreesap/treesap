import React from "react"
import { Package, Users } from "lucide-react"


export interface CmsNavData {
  type: string
  slug: string
  label: string
}

interface SidebarContentProps {
  navData: CmsNavData[]
}

export function SidebarContent({ navData }: SidebarContentProps) {

  const location = window.location;
  
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
      {navData.filter(item => item.type === "collection").length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground">Collections</h3>
          {navData.map((item) =>
            item.type === "collection" ? (
              <a
                key={item.slug}
                href={`/admin/collections/${item.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-primary transition-all hover:text-primary ${location.pathname === `/admin/collections/${item.slug}` ? "bg-primary/10 text-primary" : ``}`}
              >
                <Package className="h-4 w-4" />
                {item.label}
              </a>
            ) : null
          )}
        </div>
      )}
      {navData.filter(item => item.type === "global").length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground">Globals</h3>
          {navData.map((item) =>
            item.type === "global" ? (
              <a
                key={item.slug}
                href={`/admin/globals/${item.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 t transition-all  ${location.pathname === `/admin/globals/${item.slug}` ? "bg-primary/10 text-primary" : ``}`}
              >
                <Users className="h-4 w-4" />
                {item.label}
              </a>
            ) : null
          )}
        </div>
      )}
    </nav>
  )
}
