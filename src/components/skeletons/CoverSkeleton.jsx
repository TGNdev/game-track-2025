const CoverSkeleton = () => {
  return (
    <div className="absolute w-full h-full rounded animate-pulse z-10 bg-background">
      <div className="flex items-center justify-center h-full w-full">
        <img
          src="loading.gif"
          alt="Loading..."
          className="size-20 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default CoverSkeleton;