export const PostSkeleton = () => {
  return (
    <div className="w-full h-20 bg-background animate-pulse rounded-lg p-4">
      <div className="flex flex-col h-full w-full relative gap-4">
        <div
          className="absolute -top-6 -left-6 -rotate-6 bg-background animate-pulse w-12 h-5 py-0.5 px-2 text-sm rounded-md shadow-lg"
        />
        <div
          className="bg-background animate-pulse w-full h-6 py-0.5 px-2 text-sm rounded-md shadow-lg mt-2"
        />
        <div
          className="bg-background animate-pulse w-20 h-6 py-0.5 px-2 text-sm rounded-md shadow-lg"
        />
      </div>
    </div>
  )
}

export default PostSkeleton;