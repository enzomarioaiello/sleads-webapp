"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Trash2,
  User as UserIcon,
  Plus,
  X,
  Search,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { api } from "../../../../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";

type Member = {
  id: Id<"members">;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: number;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

type User = {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
};

export default function OrganizationMembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const members = useQuery(
    api.organizations.getMembers,
    orgId ? { organizationId: orgId as Id<"organizations"> } : "skip"
  );

  const allUsersQuery = useQuery(api.organizations.getAllUsers);
  const allUsers = (allUsersQuery || []) as User[];

  const updateMember = useMutation(api.organizations.updateMember);
  const removeMember = useMutation(api.organizations.removeMember);
  const addMember = useMutation(api.organizations.addMember);

  const [updatingMemberId, setUpdatingMemberId] =
    useState<Id<"members"> | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "member" | "owner"
  >("member");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleUpdateRole = async (memberId: Id<"members">, newRole: string) => {
    setUpdatingMemberId(memberId);
    try {
      await updateMember({
        memberId,
        role: newRole as "admin" | "member" | "owner",
      });
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update role",
        variant: "error",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: Id<"members">) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setUpdatingMemberId(memberId);
    try {
      await removeMember({ memberId });
      toast({
        title: "Member removed",
        description: "The member has been removed from the organization.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to remove member",
        variant: "error",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to add.",
        variant: "error",
      });
      return;
    }

    setIsAddingMember(true);
    try {
      await addMember({
        organizationId: orgId as Id<"organizations">,
        userId: selectedUserId,
        role: selectedRole,
      });
      toast({
        title: "Member added",
        description: "The member has been added to the organization.",
        variant: "success",
      });
      setIsAddMemberModalOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to add member",
        variant: "error",
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  // Filter users not already in the organization
  const availableUsers = allUsers.filter(
    (user: User) =>
      !members?.some((member: Member) => member.user?.id === user.id) &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (members === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Members
          </h2>
          <p className="text-sm text-gray-500 dark:text-sleads-slate400">
            Manage who has access to this organization.
          </p>
        </div>
        <button
          onClick={() => setIsAddMemberModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-sleads-blue dark:hover:bg-sleads-blue/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-sleads-slate800">
          <thead className="bg-gray-50 dark:bg-sleads-slate800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-sleads-slate400 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-sleads-slate400 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-sleads-slate400 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-sleads-slate400 uppercase tracking-wider"
              >
                Joined
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-sleads-slate900 divide-y divide-gray-200 dark:divide-sleads-slate800">
            {members?.map((member: Member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0">
                      {member.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={member.user.image}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-sleads-slate800 flex items-center justify-center text-gray-500 dark:text-sleads-slate400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user?.name || "Unknown User"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-sleads-slate400">
                    {member.user?.email || "No email"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(member.id, e.target.value)
                    }
                    disabled={updatingMemberId === member.id}
                    className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-sleads-slate800 ring-1 ring-inset ring-gray-300 dark:ring-sleads-slate700 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-sleads-slate800"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-sleads-slate400">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={updatingMemberId === member.id}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    title="Remove member"
                  >
                    {updatingMemberId === member.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {(!members || members.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500 dark:text-sleads-slate400"
                >
                  No members found in this organization.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-sleads-slate900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-sleads-slate800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Member
              </h2>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-sleads-slate300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Select User
                </label>
                <div className="mb-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 py-2 text-sm placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="mt-1 max-h-60 overflow-y-auto border border-gray-200 dark:border-sleads-slate800 rounded-md">
                  {availableUsers && availableUsers.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-sleads-slate800">
                      {availableUsers.map((user: User) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-sleads-slate800 transition-colors ${
                            selectedUserId === user.id
                              ? "bg-blue-50 dark:bg-sleads-blue/10"
                              : ""
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-sleads-slate700 flex items-center justify-center shrink-0 overflow-hidden">
                            {user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-4 w-4 text-gray-500 dark:text-sleads-slate400" />
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-sleads-slate400">
                              {user.email || "No email"}
                            </p>
                          </div>
                          {selectedUserId === user.id && (
                            <div className="ml-auto">
                              <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-sleads-slate400">
                      No users found to add.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(
                      e.target.value as "admin" | "member" | "owner"
                    )
                  }
                  className="block w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  disabled={isAddingMember}
                  className="rounded-md bg-white dark:bg-sleads-slate800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-sleads-slate700 hover:bg-gray-50 dark:hover:bg-sleads-slate700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember || !selectedUserId}
                  className="rounded-md bg-blue-600 dark:bg-sleads-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-sleads-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 flex items-center"
                >
                  {isAddingMember && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isAddingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
