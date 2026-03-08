"use client";


export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`bg-slate-200 animate-pulse rounded-2xl ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="w-16 h-8 rounded-full" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 pt-6 px-4 pb-32">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            <Skeleton className="h-32 w-full rounded-[32px] mb-8" />

            <div className="grid grid-cols-2 gap-4 mb-8">
                <Skeleton className="h-24 rounded-[28px]" />
                <Skeleton className="h-24 rounded-[28px]" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-6 w-32 ml-auto" />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

export function InventorySkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 pt-6 px-4 pb-32">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <Skeleton className="h-14 w-full rounded-[22px] mb-4" />

            <div className="flex gap-2 mb-6 overflow-hidden">
                <Skeleton className="h-8 w-20 rounded-full shrink-0" />
                <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                <Skeleton className="h-8 w-16 rounded-full shrink-0" />
                <Skeleton className="h-8 w-28 rounded-full shrink-0" />
            </div>

            <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
