const ScreenshotSkeleton = () => {
  return (
    <div className="w-full h-full bg-gray-300 animate-pulse absolute top-0 left-0 z-0">
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