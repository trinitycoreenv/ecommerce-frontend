"use client"

import { Item, ItemContent, ItemTitle, ItemDescription, ItemMedia, ItemActions } from "@/components/ui/item"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type React from "react"

interface DataListItem {
  id: string
  title: string
  description?: string
  avatar?: string
  icon?: React.ReactNode
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  actions?: React.ReactNode
  metadata?: string
}

interface DataListProps {
  items: DataListItem[]
  variant?: "default" | "outline" | "muted"
  size?: "default" | "sm"
  onItemClick?: (item: DataListItem) => void
}

export function DataList({ items, variant = "default", size = "default", onItemClick }: DataListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Item
          key={item.id}
          variant={variant}
          size={size}
          asChild={!!onItemClick}
          onClick={() => onItemClick?.(item)}
          className={cn(
            onItemClick ? "cursor-pointer" : "",
            "min-h-[44px]" // Ensure touch target size
          )}
        >
          {item.avatar || item.icon ? (
            <ItemMedia variant={item.avatar ? "image" : "icon"} className="flex-shrink-0">
              {item.avatar ? (
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={item.avatar || "/placeholder.svg"} alt={item.title} />
                  <AvatarFallback className="text-xs md:text-sm">{item.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
                  {item.icon}
                </div>
              )}
            </ItemMedia>
          ) : null}
          <ItemContent className="min-w-0 flex-1">
            <ItemTitle className="text-sm md:text-base">
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || "default"} className="ml-2 text-xs hidden sm:inline-flex">
                  {item.badge}
                </Badge>
              )}
            </ItemTitle>
            {item.description && (
              <ItemDescription className="text-xs md:text-sm line-clamp-2">
                {item.description}
              </ItemDescription>
            )}
            {item.metadata && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {item.metadata}
              </div>
            )}
          </ItemContent>
          {item.actions && (
            <ItemActions className="flex-shrink-0">
              {item.actions}
            </ItemActions>
          )}
        </Item>
      ))}
    </div>
  )
}
