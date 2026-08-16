import { PageContainer, Skeleton, SkeletonCard } from "@/components/flow/ui";

export default function FlowLoading() {
  return (
    <>
      <header className="flex items-start justify-between gap-4 border-b border-flow-border px-6 py-6 lg:px-8">
        <div>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
      </header>
      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
