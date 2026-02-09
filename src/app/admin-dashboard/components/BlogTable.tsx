"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  Eye,
  Calendar,
  Clock,
  Tag,
} from "lucide-react";

export function BlogTable() {
  const blogs = useQuery(api.blog.getAllBlogPostsAdmin);
  const deleteBlog = useMutation(api.blog.deleteBlogPost);
  const generateBlog = useAction(api.generateblog.generateBlogPost);

  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [generationTopic, setGenerationTopic] = useState("");
  const [generationCategory, setGenerationCategory] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const handleDelete = async (blogId: Id<"blog_posts">) => {
    try {
      await deleteBlog({ blogId });
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete blog:", error);
      alert("Failed to delete blog post");
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateBlog({
        topic: generationTopic || undefined,
        category: generationCategory || undefined,
        language: "nl",
      });
      if (result.success) {
        setShowGenerateModal(false);
        setGenerationTopic("");
        setGenerationCategory("");
      }
    } catch (error) {
      console.error("Failed to generate blog:", error);
      alert("Failed to generate blog post. Check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!blogs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generate Blog Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Generate Blog with AI
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Blog Post with AI
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={generationTopic}
                  onChange={(e) => setGenerationTopic(e.target.value)}
                  placeholder="e.g., UX design best practices"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to let AI choose a relevant topic
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={generationCategory}
                  onChange={(e) => setGenerationCategory(e.target.value)}
                  placeholder="e.g., Design, Technology, Business"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Cost estimate:</strong> ~$0.08 per blog post
                  <br />
                  <span className="text-xs text-blue-600">
                    Includes GPT-4o-mini text generation + DALL-E 3 image
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Blog Post
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Read Time
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {blogs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Tag className="h-8 w-8 text-gray-300" />
                    <p>No blog posts yet</p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Generate your first blog post with AI
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {blog.image && (
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {blog.title}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {blog.titleNL}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {blog.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {blog.readTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="View blog post"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {deleteConfirm === blog._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(blog._id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete blog post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      {blogs.length > 0 && (
        <div className="text-sm text-gray-500">
          Total: {blogs.length} blog post{blogs.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}




