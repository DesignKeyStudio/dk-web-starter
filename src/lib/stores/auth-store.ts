import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User, Organization, Role, Permission, UserRole } from '@/types';

interface AuthState {
  currentUserId: string | null;
  users: User[];
  organizations: Organization[];
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  initialized: boolean;
}

interface AuthActions {
  initialize: () => void;
  login: (userId: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  getCurrentUser: () => User | null;
  getActiveOrg: () => Organization | null;
  getUserRoles: (userId?: string) => UserRole[];
  getUserPermissionIds: (userId?: string) => string[];
  hasPermission: (groupName: string, actionName: string) => boolean;
  getDepartmentScope: (userId?: string) => string[] | 'all';
  canAccessEntity: (entity: { departmentIds: string[] }) => boolean;
  addOrganization: (data: Omit<Organization, 'id' | 'createdAt'> & { id?: string }) => Organization;
  addUser: (data: Omit<User, 'id' | 'createdAt'> & { id?: string }) => User;
  addRole: (data: Omit<Role, 'id' | 'createdAt'> & { id?: string }) => Role;
  addUserRole: (data: Omit<UserRole, 'id' | 'createdAt'> & { id?: string }) => UserRole;
  updateUser: (id: string, data: Partial<User>) => void;
  updateUserTheme: (theme: 'light' | 'dark') => void;
  updateOrganization: (id: string, data: Partial<Organization>) => void;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  removeUserRole: (id: string) => void;
  deactivateUser: (id: string) => void;
  reset: () => void;
}

const initialState: AuthState = {
  currentUserId: null,
  users: [],
  organizations: [],
  roles: [],
  permissions: [],
  userRoles: [],
  initialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: () => {
        if (get().initialized) return;
        set({ initialized: true });
      },

      login: (userId: string) => {
        get().initialize();
        set({ currentUserId: userId });
      },

      logout: () => {
        set({ currentUserId: null });
      },

      switchUser: (userId: string) => {
        set({ currentUserId: userId });
      },

      getCurrentUser: () => {
        const { currentUserId, users } = get();
        if (!currentUserId) return null;
        return users.find((u) => u.id === currentUserId) ?? null;
      },

      getActiveOrg: () => {
        const { currentUserId, users, organizations } = get();
        if (!currentUserId) return organizations[0] ?? null;
        const user = users.find((u) => u.id === currentUserId);
        if (!user) return organizations[0] ?? null;
        return organizations.find((o) => o.id === user.organizationId) ?? organizations[0] ?? null;
      },

      getUserRoles: (userId?: string) => {
        const { currentUserId, userRoles } = get();
        const uid = userId ?? currentUserId;
        if (!uid) return [];
        return userRoles.filter((ur) => ur.userId === uid);
      },

      getUserPermissionIds: (userId?: string) => {
        const state = get();
        const { currentUserId, users, roles } = state;
        const uid = userId ?? currentUserId;
        if (!uid) return [];

        const user = users.find((u) => u.id === uid);
        if (!user) return [];

        if (user.isSuperAdmin) {
          return state.permissions.map((p) => p.id);
        }

        const uRoles = state.userRoles.filter((ur) => ur.userId === uid);
        const permIds = new Set<string>();
        for (const ur of uRoles) {
          const role = roles.find((r) => r.id === ur.roleId);
          if (role) {
            for (const pid of role.permissionIds) {
              permIds.add(pid);
            }
          }
        }
        return Array.from(permIds);
      },

      hasPermission: (groupName: string, actionName: string) => {
        const state = get();
        const { currentUserId, users, permissions } = state;
        if (!currentUserId) return false;

        const user = users.find((u) => u.id === currentUserId);
        if (!user) return false;
        if (user.isSuperAdmin) return true;

        const perm = permissions.find(
          (p) => p.groupName === groupName && p.name === actionName
        );
        if (!perm) return false;

        const userPermIds = state.getUserPermissionIds();
        return userPermIds.includes(perm.id);
      },

      getDepartmentScope: (userId?: string) => {
        const state = get();
        const { currentUserId, users } = state;
        const uid = userId ?? currentUserId;
        if (!uid) return [];

        const user = users.find((u) => u.id === uid);
        if (!user) return [];

        if (user.isSuperAdmin) return 'all';

        const uRoles = state.userRoles.filter((ur) => ur.userId === uid);

        const hasUnscoped = uRoles.some((ur) => ur.departmentIds.length === 0);
        if (hasUnscoped) return 'all';

        const deptIds = new Set<string>();
        for (const ur of uRoles) {
          for (const did of ur.departmentIds) {
            deptIds.add(did);
          }
        }
        return Array.from(deptIds);
      },

      canAccessEntity: (entity: { departmentIds: string[] }) => {
        const scope = get().getDepartmentScope();
        if (scope === 'all') return true;
        if (entity.departmentIds.length === 0) return true;
        return entity.departmentIds.some((d) => scope.includes(d));
      },

      addOrganization: (data) => {
        const org: Organization = {
          ...data,
          id: data.id ?? uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ organizations: [...s.organizations, org] }));
        return org;
      },

      addUser: (data) => {
        const user: User = {
          ...data,
          id: data.id ?? uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ users: [...s.users, user] }));
        return user;
      },

      addRole: (data) => {
        const role: Role = {
          ...data,
          id: data.id ?? uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ roles: [...s.roles, role] }));
        return role;
      },

      addUserRole: (data) => {
        const userRole: UserRole = {
          ...data,
          id: data.id ?? uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ userRoles: [...s.userRoles, userRole] }));
        return userRole;
      },

      updateUser: (id, data) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        }));
      },

      updateUserTheme: (theme: 'light' | 'dark') => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;
        set({
          users: users.map((u) =>
            u.id === currentUserId ? { ...u, theme } : u
          ),
        });
      },

      updateOrganization: (id, data) => {
        set((s) => ({
          organizations: s.organizations.map((o) =>
            o.id === id ? { ...o, ...data } : o
          ),
        }));
      },

      updateRole: (id, data) => {
        set((s) => ({
          roles: s.roles.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteRole: (id) => {
        set((s) => ({
          roles: s.roles.filter((r) => r.id !== id),
          userRoles: s.userRoles.filter((ur) => ur.roleId !== id),
        }));
      },

      removeUserRole: (id) => {
        set((s) => ({
          userRoles: s.userRoles.filter((ur) => ur.id !== id),
        }));
      },

      deactivateUser: (id) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, isActive: false } : u
          ),
        }));
      },

      reset: () => {
        set({
          ...initialState,
        });
      },
    }),
    {
      name: 'lp-auth-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);
