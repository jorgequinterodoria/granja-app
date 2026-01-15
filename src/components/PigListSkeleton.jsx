import Skeleton from './Skeleton';

export default function PigListSkeleton({ count = 6 }) {
    return (
        <div className="mt-12">
            {/* Header skeleton */}
            <div className="mb-6 px-2">
                <Skeleton variant="title" className="w-64" />
            </div>

            {/* Grid of skeleton cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden"
                    >
                        {/* Gradient Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 to-slate-300"></div>

                        {/* Status Stripe */}
                        <div className="absolute left-0 top-1 bottom-0 w-1 bg-slate-200"></div>

                        <div className="flex justify-between items-start mb-4 pl-3">
                            <div className="flex-1">
                                {/* Pig icon and name */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Skeleton variant="circle" className="w-8 h-8" />
                                    <Skeleton variant="text" className="w-20" />
                                </div>
                                {/* Optional name */}
                                <div className="ml-10 mb-2">
                                    <Skeleton variant="line-short" className="w-16" />
                                </div>
                                {/* Stage badge */}
                                <Skeleton variant="button" className="w-16 h-6 rounded-full" />
                            </div>
                            <div className="text-right">
                                {/* Sex badge */}
                                <Skeleton variant="button" className="w-16 h-6 rounded-xl" />
                            </div>
                        </div>

                        <div className="flex justify-between items-end pl-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                {/* Weight icon */}
                                <Skeleton variant="circle" className="w-10 h-10 rounded-xl" />
                                <div>
                                    {/* Weight label and value */}
                                    <Skeleton variant="line" className="w-16 h-3 mb-1" />
                                    <Skeleton variant="text" className="w-12 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {/* Sync status badge */}
                                <Skeleton variant="button" className="w-16 h-7 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}