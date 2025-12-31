import { Calendar } from "lucide-react";

interface PageLoaderProps {
  pageName: string;
}

const PageLoader = ({ pageName }: PageLoaderProps) => {
  return (
    <div className="text-center py-10">
      <Calendar className="w-10 h-10 animate-spin mx-auto text-blue-500" />
      <p className="mt-4 text-gray-600">Loading {pageName}...</p>
    </div>
  );
};

export { PageLoader };
