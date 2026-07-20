import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-white/80 dark:bg-gray-900/80 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4 pt-20">
          <div className="flex justify-center">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
      </div>
      <div className="border-t bg-white/80 dark:bg-gray-900/80 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
