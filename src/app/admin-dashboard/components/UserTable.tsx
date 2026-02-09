/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/app/admin-dashboard/components/ui/table"; // Wait, I don't have these. I need to create them or use simple div/table.
// // I will use standard HTML table with Tailwind classes for simplicity as I didn't create a Table component.
import { Badge } from "./ui/Badge";
import { BanUserDialog } from "./BanUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import {
  Loader2,
  Shield,
  ShieldAlert,
  Trash2,
  Key,
  UserCheck,
  UserX,
  LogIn,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define User type based on expected response
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  banned?: boolean;
  emailVerified: boolean;
  createdAt: Date;
  image?: string;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100, // Fetch up to 100 for now
        },
      });
      console.log("List users response:", res);

      setUsers(res.data?.users || (res as any).users || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleImpersonate = async (userId: string) => {
    try {
      await authClient.admin.impersonateUser({
        userId,
      });
      window.location.href = "/"; // Force full reload to home as the user
    } catch (error) {
      console.error("Failed to impersonate", error);
      alert("Failed to impersonate user");
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm("Are you sure you want to unban this user?")) return;
    try {
      await authClient.admin.unbanUser({
        userId,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban", error);
      alert("Failed to unban user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    try {
      await authClient.admin.removeUser({
        userId,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete user");
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    if (!confirm("Mark this user's email as verified?")) return;
    try {
      await authClient.admin.updateUser({
        userId,
        data: {
          emailVerified: true,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to verify email", error);
      alert("Failed to verify email");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    )
      return;
    try {
      await authClient.admin.setRole({
        userId,
        role: newRole as "user" | "admin",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to change role", error);
      alert("Failed to change role");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Verified
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.image ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.image}
                          alt=""
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                          {user.name?.[0]?.toUpperCase() ||
                            user.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "No Name"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge
                    variant={user.role === "admin" ? "success" : "default"}
                  >
                    {user.role || "user"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.banned ? (
                    <Badge variant="error">Banned</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center text-green-600">
                      <UserCheck className="mr-1 h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-yellow-600">
                      <UserX className="mr-1 h-4 w-4" /> No
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleImpersonate(user.id)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Impersonate"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>
                    {user.role !== "admin" ? (
                      <button
                        onClick={() => handleRoleChange(user.id, "admin")}
                        className="text-gray-400 hover:text-blue-600"
                        title="Make Admin"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.id, "user")}
                        className="text-gray-400 hover:text-yellow-600"
                        title="Remove Admin"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                    {!user.emailVerified && (
                      <button
                        onClick={() => handleVerifyEmail(user.id)}
                        className="text-gray-400 hover:text-green-600"
                        title="Verify Email"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsPasswordDialogOpen(true);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                      title="Change Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    {user.banned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        className="text-gray-400 hover:text-green-600"
                        title="Unban User"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsBanDialogOpen(true);
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Ban User"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <>
          <BanUserDialog
            isOpen={isBanDialogOpen}
            onClose={() => {
              setIsBanDialogOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            userName={selectedUser.name || selectedUser.email}
            onSuccess={fetchUsers}
          />
          <ChangePasswordDialog
            isOpen={isPasswordDialogOpen}
            onClose={() => {
              setIsPasswordDialogOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            userName={selectedUser.name || selectedUser.email}
            onSuccess={fetchUsers}
          />
        </>
      )}
    </div>
  );
}
