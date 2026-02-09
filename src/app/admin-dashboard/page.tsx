"use client";
import Link from "next/link";
import { Users, ArrowRight, MessageSquare, Building, FileText } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";

export default function AdminDashboardPage() {
  const contacts = useQuery(api.contact.getContactForms);
  const blogCount = useQuery(api.blog.getBlogCount);

  const unreadRegular =
    contacts?.regularForms.filter((f: Doc<"contact_regular_form">) => !f.read)
      .length || 0;
  const unreadProject =
    contacts?.projectForms.filter((f: Doc<"contact_project_form">) => !f.read)
      .length || 0;
  const totalUnread = unreadRegular + unreadProject;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Users Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    User Management
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Manage Users
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin-dashboard/users"
                className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
              >
                View all users <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Organizations Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <Building className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Organization Management
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Manage Organizations
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin-dashboard/organizations"
                className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
              >
                View all organizations <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Blog Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <FileText className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Blog Posts
                  </dt>
                  <dd>
                    <div className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {blogCount ?? 0}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        published posts
                      </div>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin-dashboard/blog"
                className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
              >
                Manage blog posts <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <MessageSquare
                  className="h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Contact Submissions
                  </dt>
                  <dd>
                    <div className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {totalUnread}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        unread messages
                      </div>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin-dashboard/contact"
                className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
              >
                View all messages <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
