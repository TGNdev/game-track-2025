const ScreenshotSkeleton = () => {
  return (
    <div className="w-full h-full animate-pulse absolute top-0 left-0 z-0 bg-background">
      <div className="flex items-center justify-center h-full w-full">
        <img
          src="loading.gif"
          alt="Loading..."
          className="size-32 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default ScreenshotSkeleton;