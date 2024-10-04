import React from "react"
import { Home, ShoppingCart, Package, Users, LineChart, Package2, Bell } from "lucide-react"
import { Button } from "../ui/button.tsx"
import type { CmsNavData } from '@treesap/treesap'
import { SidebarContent } from "./sidebar-content.tsx"

export default function Sidebar({ navData }: { navData: CmsNavData[] }) {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <a href="/admin" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Treesap CMS</span>
          </a>
      
        </div>
        <div className="flex-1">
         <SidebarContent navData={navData} />
        </div>
      </div>
    </div>
  )
}
