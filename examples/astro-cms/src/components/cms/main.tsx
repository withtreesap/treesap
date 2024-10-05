import React from "react"

export default function Main({
  title,
  children
}: {
  title: string;
  children: React.ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {title && (
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
        </div>
      )}
      <div
        className="flex flex-1 rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        {children}
      </div>
    </main>
  )
}
