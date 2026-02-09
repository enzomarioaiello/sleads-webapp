"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "./ui/Badge";
import {
  Check,
  Mail,
  MessageSquare,
  Briefcase,
  Calendar,
  User,
  Phone,
  Building,
  Loader2,
  Inbox,
  Eye,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Modal } from "./ui/Modal";

type ContactType = "regular" | "project";
type FilterStatus = "all" | "read" | "unread";

export function ContactTable() {
  const [activeTab, setActiveTab] = useState<ContactType>("regular");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const contacts = useQuery(api.contact.getContactForms);
  const markAsRead = useMutation(api.contact.markContactFormAsRead);

  const handleMarkAsRead = async (
    id: Id<"contact_regular_form"> | Id<"contact_project_form">
  ) => {
    try {
      await markAsRead({ contactFormId: id });
    } catch (error) {
      console.error("Failed to mark as read", error);
      alert("Failed to mark as read");
    }
  };

  if (!contacts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { regularForms, projectForms } = contacts;
  const currentForms = activeTab === "regular" ? regularForms : projectForms;

  // Filter forms
  const filteredForms = (currentForms || []).filter((form) => {
    // Status filter
    if (statusFilter === "read" && !form.read) return false;
    if (statusFilter === "unread" && form.read) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = form.name?.toLowerCase().includes(query);
      const matchesEmail = form.email?.toLowerCase().includes(query);
      const matchesSubject = form.subject?.toLowerCase().includes(query);
      const matchesMessage = form.message?.toLowerCase().includes(query);
      const matchesCompany = (form as any).companyName
        ?.toLowerCase()
        .includes(query);

      return (
        matchesName ||
        matchesEmail ||
        matchesSubject ||
        matchesMessage ||
        matchesCompany
      );
    }

    return true;
  });

  // Sort by createdAt desc
  const sortedForms = [...filteredForms].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "regular"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("regular")}
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Regular Inquiries</span>
            <Badge variant="default" className="ml-2">
              {regularForms?.filter((f) => !f.read).length || 0}
            </Badge>
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "project"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("project")}
        >
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span>Project Requests</span>
            <Badge variant="default" className="ml-2">
              {projectForms?.filter((f) => !f.read).length || 0}
            </Badge>
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          {sortedForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Inbox className="h-12 w-12 mb-4 text-gray-300" />
              <p>No messages found matching your criteria</p>
              {(searchQuery || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedForms.map((form) => (
                  <tr
                    key={form._id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      !form.read ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => setSelectedMessage(form)}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {form.read ? (
                        <Badge variant="success">Read</Badge>
                      ) : (
                        <Badge variant="warning">New</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <User className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[150px]" title={form.name}>{form.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-2 h-3 w-3" />
                          <span className="truncate max-w-[150px]" title={form.email}>{form.email}</span>
                        </div>
                        {activeTab === "project" && (
                          <>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Building className="mr-2 h-3 w-3" />
                              <span className="truncate max-w-[150px]" title={(form as any).companyName}>{(form as any).companyName}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium truncate max-w-[200px]" title={form.subject}>
                        {form.subject}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1 max-w-[200px]" title={form.message}>
                        {form.message}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 pl-6">
                        {new Date(form.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div
                        className="flex justify-end space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedMessage(form)}
                          className="text-gray-400 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!form.read && (
                          <button
                            onClick={() => handleMarkAsRead(form._id)}
                            className="text-gray-400 hover:text-green-600"
                            title="Mark as Read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.subject || "Message Details"}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedMessage.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Mail className="h-3 w-3 mr-1" /> {selectedMessage.email}
                </p>
                {activeTab === "project" && (
                  <>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Building className="h-3 w-3 mr-1" />{" "}
                      {(selectedMessage as any).companyName}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />{" "}
                      {(selectedMessage as any).phone}
                    </p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                {!selectedMessage.read && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(selectedMessage._id);
                      setSelectedMessage((prev: any) => ({
                        ...prev,
                        read: true,
                      }));
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center justify-end w-full"
                  >
                    <Check className="h-3 w-3 mr-1" /> Mark as Read
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-wrap text-gray-700">
                {selectedMessage.message}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
