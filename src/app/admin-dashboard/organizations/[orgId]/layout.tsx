"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { cn } from "@/app/utils/cn";
import {
  Users,
  ArrowLeft,
  LayoutDashboard,
  Building,
  Contact,
  FolderKanban,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const orgId = params.orgId as string;

  const organization = useQuery(api.organizations.getOrganization, {
    organizationId: orgId as Id<"organizations">,
  });

  const tabs = [
    {
      name: "Overview",
      href: `/admin-dashboard/organizations/${orgId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Members",
      href: `/admin-dashboard/organizations/${orgId}/members`,
      icon: Users,
      exact: false,
    },
    {
      name: "Contact",
      href: `/admin-dashboard/organizations/${orgId}/contact`,
      icon: Contact,
      exact: false,
    },
    {
      name: "Projects",
      href: `/admin-dashboard/organizations/${orgId}/projects`,
      icon: FolderKanban,
      exact: false,
    },
    // { name: "Settings", href: `/admin-dashboard/organizations/${orgId}/settings`, icon: Settings, exact: false },
  ];

  if (organization === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Organization not found</h2>
        <Link
          href="/admin-dashboard/organizations"
          className="text-blue-600 hover:underline"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin-dashboard/organizations"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex items-center gap-3">
          {organization.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organization.logo}
              alt={organization.name}
              className="w-10 h-10 rounded-full object-cover border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border">
              <Building className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <p className="text-sm text-gray-500">/{organization.slug}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname?.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                  "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <tab.icon
                  className={cn(
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500",
                    "mr-2 -ml-0.5 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="min-h-[400px]">{children}</div>
    </div>
  );
}
