"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Search } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const NoOrganizationSelected = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  // Fetch user organizations
  const organizations = useQuery(api.organizations.getMyOrganizations);

  const filteredOrganizations = organizations?.filter(
    (org) =>
      org?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org?.slug && org?.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasOrganizations = organizations && organizations.length > 0;
  const hasSearchResults =
    filteredOrganizations && filteredOrganizations.length > 0;

  // Loading State
  if (!organizations) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mb-4"></div>
        <p className="text-slate-500 dark:text-sleads-slate400">
          Loading organizations...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mb-12"
      >
        <div className="w-20 h-20 bg-blue-50 dark:bg-sleads-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sleads-blue/10">
          <Image src="/images/logo.png" alt="Sleads" width={60} height={60} />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
          Select an Organization
        </h1>
        <p className="text-slate-500 dark:text-sleads-slate400 text-lg">
          Choose an organization to manage your projects and team.
        </p>
      </motion.div>

      {/* Search Bar - Only show if there are organizations to search */}
      {hasOrganizations && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md mb-10 relative"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 dark:text-sleads-slate500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations..."
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-sleads-slate900/50 border border-slate-200 dark:border-sleads-slate800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all shadow-sm hover:shadow-md"
          />
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-4 pb-10"
      >
        {hasSearchResults ? (
          filteredOrganizations?.map((org) => (
            <motion.button
              key={org?._id}
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              onClick={() => {
                router.push(`/dashboard/${org?._id}`);
              }}
              onMouseEnter={() => setHoveredId(org?._id || null)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative group text-left bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-sleads-blue/10 hover:border-sleads-blue/30 dark:hover:border-sleads-blue/30 transition-all duration-300 h-full flex flex-col"
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-sleads-blue/0 via-sleads-blue/0 to-sleads-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 w-full flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-50 dark:bg-sleads-blue/10 text-sleads-blue group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                    {org?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org?.logo}
                        alt={org?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-sleads-blue transition-colors truncate w-full">
                  {org?.name}
                </h3>

                <p className="text-sm text-slate-500 dark:text-sleads-slate400 mb-6 line-clamp-2 min-h-10">
                  {org?.slug ? `@${org?.slug}` : "No identifier"}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-sleads-slate800">
                  <span className="text-sm font-semibold text-slate-600 dark:text-sleads-slate300 group-hover:text-sleads-blue transition-colors">
                    Open Organization
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 text-sleads-blue transition-transform duration-300 ${
                      hoveredId === org?._id ? "translate-x-1" : ""
                    }`}
                  />
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1 },
            }}
            className="col-span-full text-center py-12 bg-white dark:bg-sleads-slate900 rounded-2xl border border-slate-200 dark:border-sleads-slate800"
          >
            {hasOrganizations ? (
              <p className="text-slate-500 dark:text-sleads-slate400">
                No organizations found matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <p className="text-slate-500 dark:text-sleads-slate400">
                You are not a member of any organizations yet.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
