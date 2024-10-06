import React from "react"
import { Book, Image, LibraryBig, Settings, Users, Plus } from "lucide-react"
import type { CmsNavData } from "@treesap/treesap"

interface SidebarContentProps {
  navData: CmsNavData[]
}

export function SidebarContent({ navData }: SidebarContentProps) {

  const location = window.location;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
      {/* <a
        href={`/admin/settings`}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 t transition-all  ${location.pathname === `/admin/settings` ? "bg-primary/10 text-primary" : ``}`}
      >
        <Settings className="h-4 w-4" />
        Settings
      </a> */}
      <a
        href={`/admin/users`}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 t transition-all  ${location.pathname === `/admin/users` ? "bg-primary/10 text-primary" : ``}`}
      >
        <Users className="h-4 w-4" />
        Users
      </a>
      <a
        href={`/admin/media`}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 t transition-all  ${location.pathname === `/admin/media` ? "bg-primary/10 text-primary" : ``}`}
      >
        <Image className="h-4 w-4" />
        Media
      </a>


      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground">Collections</h3>
      </div>
      {navData.filter(item => item.type === "collection").length > 0 && (
        <div className="flex flex-col gap-2">
          {navData.map((item) =>
            item.type === "collection" ? (
              <a
                key={item.slug}
                href={`/admin/collections/${item.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-primary transition-all hover:text-primary ${location.pathname === `/admin/collections/${item.slug}` ? "bg-primary/10 text-primary" : ``}`}
              >
                <LibraryBig className="h-4 w-4" />
                {item.name}
              </a>
            ) : null
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground">Globals</h3>
      </div>
      {navData.filter(item => item.type === "global").length > 0 && (
        <div className="flex flex-col gap-2">
          {navData.map((item) =>
            item.type === "global" ? (
              <a
                key={item.slug}
                href={`/admin/globals/${item.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all  ${location.pathname === `/admin/globals/${item.slug}` ? "bg-primary/10 text-primary" : ``}`}
              >
                <Book className="h-4 w-4" />
                {item.name}
              </a>
            ) : null
          )}
        </div>
      )}
    </nav>
  )
}
