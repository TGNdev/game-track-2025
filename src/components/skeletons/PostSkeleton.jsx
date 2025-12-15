export const PostSkeleton = () => {
  return (
    <div className="block relative bg-background rounded-2xl shadow-lg hover:scale-105 transition border-primary animate-pulse">
      <div className="p-4 space-y-4">
        <div
          className="absolute -top-2 -left-2 -rotate-6 bg-background w-20 h-5 py-0.5 px-2 text-sm rounded-md shadow-lg"
        />
        <div
          className="bg-background w-full h-6 py-0.5 px-2 text-sm rounded-md shadow-lg"
        />
        <div
          className="bg-background w-20 h-6 py-0.5 px-2 text-sm rounded-md shadow-lg"
        />
      </div>
    </div>
  );
};

export default PostSkeleton;