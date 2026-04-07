/** React Query cache keys — centralized to avoid typos and enable targeted invalidation. */
export const queryKeys = {
  usersWithOrgs: ["users-with-orgs"] as const,
  roles: ["roles"] as const,
  permissions: ["permissions"] as const,
  userRoles: ["user-roles"] as const,
  departments: ["departments"] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  activityLog: ["activity-log"] as const,
  // TODO: Add your domain query keys here
  // subscriptions: ["subscriptions"] as const,
};
