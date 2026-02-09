"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { authClient } from "@/lib/auth-client";

interface BanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function BanUserDialog({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBan = async () => {
    setIsLoading(true);
    try {
      await authClient.admin.banUser({
        userId,
        banReason: reason,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to ban user", error);
      alert("Failed to ban user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ban User: ${userName}`}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reason for ban
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Violation of terms..."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBan} isLoading={isLoading}>
            Ban User
          </Button>
        </div>
      </div>
    </Modal>
  );
}

