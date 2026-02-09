import { BlogTable } from "../components/BlogTable";

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and generate blog posts with AI
          </p>
        </div>
      </div>
      <BlogTable />
    </div>
  );
}



