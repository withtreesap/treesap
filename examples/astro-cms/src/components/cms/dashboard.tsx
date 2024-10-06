import React from "react"
import Sidebar from "./sidebar.tsx"
import Header from "./header.tsx"
import type { CmsNavData } from '@treesap/treesap'

export function Dashboard({
  navData,
  children,
}: {
  navData: CmsNavData[]
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar navData={navData} />
      <div className="flex flex-col">
        <Header navData={navData} />
        {children}
      </div>
    </div>
  )
}