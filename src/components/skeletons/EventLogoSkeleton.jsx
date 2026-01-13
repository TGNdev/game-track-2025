const EventLogoSkeleton = () => {
  return (
    <div className="w-full bg-black/20 animate-pulse rounded-md flex items-center justify-center">
      <div className="flex items-center justify-center h-full w-full">
        <img
          src="loading.gif"
          alt="Loading..."
          className="size-32 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default EventLogoSkeleton;
