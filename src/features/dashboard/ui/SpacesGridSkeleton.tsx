import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SpacesGridSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-72 w-full rounded-home-card" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex h-40 overflow-hidden rounded-home-card p-0">
            <Skeleton className="w-[132px] shrink-0 rounded-none" />
            <div className="flex-1 space-y-2 p-4">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-full opacity-60" />
              <Skeleton className="h-2.5 w-5/6 opacity-60" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
