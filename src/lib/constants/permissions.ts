/**
 * Platform-level permissions — seeded once, global (not org-scoped).
 * TODO: Replace these with your domain permission groups.
 *
 * Example additions for a SaaS with subscriptions:
 *   { name: "Add", groupName: "Subscriptions" },
 *   { name: "View", groupName: "Subscriptions" },
 *   { name: "Edit", groupName: "Subscriptions" },
 *   { name: "Delete", groupName: "Subscriptions" },
 */
export const DEFAULT_PERMISSIONS = [
  { name: "View", groupName: "Dashboard" },
  { name: "Edit Settings", groupName: "Settings" },
  { name: "Manage", groupName: "Notifications" },
  // TODO: Add your domain permission groups here
] as const;

/** Helper to create "Group:Action" key */
export const permKey = (groupName: string, name: string) => `${groupName}:${name}`;

/** All permission keys */
const ALL_PERM_KEYS = DEFAULT_PERMISSIONS.map((p) => permKey(p.groupName, p.name));

/**
 * Default role → permission mapping.
 * Each org gets these 4 system roles on creation.
 * TODO: Update permissions for each role to match your domain.
 */
export const ROLE_DEFINITIONS: { name: string; permissions: string[] }[] = [
  {
    name: "Admin",
    permissions: ALL_PERM_KEYS,
  },
  {
    name: "Manager",
    permissions: [
      "Dashboard:View",
      "Notifications:Manage",
      // TODO: Add domain permissions for Manager
    ],
  },
  {
    name: "Contributor",
    permissions: [
      "Dashboard:View",
      // TODO: Add domain permissions for Contributor
    ],
  },
  {
    name: "Viewer",
    permissions: [
      "Dashboard:View",
      // TODO: Add domain permissions for Viewer
    ],
  },
];
