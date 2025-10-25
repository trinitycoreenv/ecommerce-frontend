"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SideNavProps {
  items: {
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export default function SideNav({ items }: SideNavProps) {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
              pathname === item.href ? "bg-accent" : "transparent"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}