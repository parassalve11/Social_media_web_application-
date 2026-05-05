"use client";

export default function PostSkeleton() {
  return (
    <article className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 p-6 mx-auto max-w-lg animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
      </div>

      {/* Text Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Image Skeleton */}
      <div className="w-full h-60 bg-gray-200 rounded-lg mb-4" />

      {/* Action Buttons */}
      <div className="flex justify-between items-center border-t pt-3 mb-3">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="w-24 h-8 bg-gray-200 rounded-md"
            />
          ))}
      </div>

      {/* Comment Section (if visible) */}
      <div className="space-y-3 mb-4">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input Skeleton */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-full" />
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
      </div>
    </article>
  );
}
