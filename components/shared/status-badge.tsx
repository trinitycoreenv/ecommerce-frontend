import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status =
  | "pending"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "active"
  | "inactive"
  | "completed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "in_transit"
  | "delayed"
  | "failed"
  | "confirmed"
  | "scheduled"
  | "draft"
  | "discontinued"

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<
  Status,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  pending: { label: "Pending", variant: "secondary", className: "bg-warning/10 text-warning hover:bg-warning/20" },
  pending_approval: { label: "Pending Approval", variant: "secondary", className: "bg-warning/10 text-warning hover:bg-warning/20" },
  approved: { label: "Approved", variant: "default", className: "bg-success/10 text-success hover:bg-success/20" },
  rejected: { label: "Rejected", variant: "destructive", className: "" },
  active: { label: "Active", variant: "default", className: "bg-success/10 text-success hover:bg-success/20" },
  inactive: { label: "Inactive", variant: "secondary", className: "" },
  completed: { label: "Completed", variant: "default", className: "bg-success/10 text-success hover:bg-success/20" },
  processing: {
    label: "Processing",
    variant: "secondary",
    className: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  shipped: { label: "Shipped", variant: "default", className: "bg-primary/10 text-primary hover:bg-primary/20" },
  delivered: { label: "Delivered", variant: "default", className: "bg-success/10 text-success hover:bg-success/20" },
  cancelled: { label: "Cancelled", variant: "destructive", className: "" },
  in_transit: {
    label: "In Transit",
    variant: "default",
    className: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  delayed: {
    label: "Delayed",
    variant: "destructive",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  failed: { label: "Failed", variant: "destructive", className: "" },
  confirmed: { label: "Confirmed", variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" },
  scheduled: { label: "Scheduled", variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" },
  draft: { label: "Draft", variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700" },
  discontinued: { label: "Discontinued", variant: "destructive", className: "" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  // Fallback for unknown status values
  if (!config) {
    return (
      <Badge variant="outline" className={cn("bg-gray-100 text-gray-800", className)}>
        {status}
      </Badge>
    )
  }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
