import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SpacesGridSkeleton() {
  const cardAspects = [
    'aspect-[2/3]',
    'aspect-[3/5]',
    'aspect-[2/3]',
    'aspect-[3/5]',
    'aspect-[2/3]',
    'aspect-[3/5]',
  ];

  return (
    <div className="space-y-8">
      <Skeleton className="h-72 w-full rounded-home-card" />
      <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 min-[600px]:grid-cols-3 min-[720px]:grid-cols-4 min-[900px]:grid-cols-5">
        {cardAspects.map((aspect, i) => (
          <Card
            key={i}
            className={`relative w-full overflow-hidden rounded-home-card p-0 ${aspect}`}
          >
            <Skeleton className="absolute inset-0 rounded-none" />
            <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent px-4 pb-4 pt-24">
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full opacity-60" />
                <Skeleton className="h-3 w-4/5 opacity-60" />
              </div>
              <Skeleton className="h-6 w-24 opacity-60" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
