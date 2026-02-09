import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  // Define your resources and actions here
  project: ["create", "share", "update", "delete"],
  // You can add more resources as needed
  user: ["ban", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  project: ["create"],
});

export const admin = ac.newRole({
  project: ["create", "share", "update", "delete"],
  user: ["ban", "delete"],
});
