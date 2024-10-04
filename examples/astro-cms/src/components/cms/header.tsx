import React from "react"
import { Menu, CircleUser, Package2, Home, ShoppingCart, Package, Users, LineChart } from "lucide-react"
import { Button } from "../ui/button.tsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu.tsx"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet.tsx"
import type { CmsNavData } from '@treesap/treesap'
import { SidebarContent } from './sidebar-content.tsx'

interface HeaderProps {
  navData: CmsNavData[]
}

export default function Header({ navData }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <a href="/admin" className="px-4 flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Treesap CMS</span>
          </a>
          <SidebarContent navData={navData} />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Additional header content can go here */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
