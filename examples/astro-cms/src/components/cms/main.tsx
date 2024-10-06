import React from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"

export default function Main({
  title,
  buttonText,
  buttonHref,
  children
}: {
  title: string;
  buttonText?: string;
  buttonHref?: string;
  children: React.ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
          {buttonText && buttonHref && (
            <a href={buttonHref} className={buttonVariants({variant: "default"})}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {buttonText}
            </a>
          )}
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
