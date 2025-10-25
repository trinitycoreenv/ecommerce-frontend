export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Removed duplicate sidebar - main sidebar is already rendered by AppLayout
  // This was causing duplicate navigation icons in the admin section
  return <>{children}</>
}