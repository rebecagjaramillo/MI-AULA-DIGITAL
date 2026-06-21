import { TopBar } from './TopBar'
import { Skeleton } from '@/components/ui/skeleton'

export function PageLayout({ title, subtitle, action, hideTopBar, isLoading, children }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {!hideTopBar && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 sm:w-64 bg-slate-200" />
              <Skeleton className="h-4 w-72 sm:w-96 bg-slate-200" />
            </div>
            <Skeleton className="h-10 w-full sm:w-32 bg-slate-200" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[150px] w-full rounded-2xl bg-slate-200" />
          <Skeleton className="h-[150px] w-full rounded-2xl bg-slate-200" />
          <Skeleton className="h-[150px] w-full rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {!hideTopBar && <TopBar title={title} subtitle={subtitle} action={action} />}
      {children}
    </div>
  )
}
