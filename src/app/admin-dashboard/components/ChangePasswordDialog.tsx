"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { authClient } from "@/lib/auth-client";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function ChangePasswordDialog({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await authClient.admin.setUserPassword({
        userId,
        newPassword: password,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to change password", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Password for ${userName}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} isLoading={isLoading}>
            Update Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
