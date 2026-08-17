"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "ADMIN" | "SUPERVISOR" | "USER";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  department: string;
  status: "Active" | "Idle" | "Offline";
  lastActive?: string;
  machinesManaged?: number;
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: "usr-admin-01",
    name: "Dr. Sarah Chen",
    email: "admin@factorymind.ai",
    role: "ADMIN",
    title: "Factory Director & AI Admin",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Executive & AI Systems",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 26,
  },
  {
    id: "usr-super-01",
    name: "Marcus Vance",
    email: "supervisor@factorymind.ai",
    role: "SUPERVISOR",
    title: "Plant Floor Shift Supervisor",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    department: "Plant Operations & Quality",
    status: "Active",
    lastActive: "2 min ago",
    machinesManaged: 16,
  },
  {
    id: "usr-op-01",
    name: "Elena Rostova",
    email: "user@factorymind.ai",
    role: "USER",
    title: "Senior Machine Operator",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    department: "Assembly Line Beta",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 6,
  },
  {
    id: "usr-op-02",
    name: "Vikram Patel",
    email: "vikram@factorymind.ai",
    role: "USER",
    title: "CNC Machine Specialist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "Precision Machining",
    status: "Active",
    lastActive: "15 min ago",
    machinesManaged: 4,
  },
  {
    id: "usr-tech-01",
    name: "David Kim",
    email: "david@factorymind.ai",
    role: "USER",
    title: "Field Maintenance Technician",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "Preventive Maintenance",
    status: "Idle",
    lastActive: "1 hour ago",
    machinesManaged: 3,
  },
];

export const ROLE_PERMISSIONS: Record<UserRole, {
  name: string;
  badge: string;
  color: string;
  allowedSections: number[];
  canManageUsers: boolean;
  canEditSettings: boolean;
  canTrainModels: boolean;
  canOverrideSafety: boolean;
}> = {
  ADMIN: {
    name: "Administration",
    badge: "ADMIN",
    color: "#f59e0b", // Amber/Gold
    allowedSections: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    canManageUsers: true,
    canEditSettings: true,
    canTrainModels: true,
    canOverrideSafety: true,
  },
  SUPERVISOR: {
    name: "Supervisor",
    badge: "SUPERVISOR",
    color: "#06b6d4", // Cyan
    allowedSections: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    canManageUsers: false, // View only
    canEditSettings: false, // Partial
    canTrainModels: false, // Inference only
    canOverrideSafety: false,
  },
  USER: {
    name: "User (Operator)",
    badge: "USER",
    color: "#10b981", // Emerald
    allowedSections: [0, 1, 4, 5, 6, 7, 8],
    canManageUsers: false,
    canEditSettings: false,
    canTrainModels: false,
    canOverrideSafety: false,
  },
};

interface AuthContextType {
  user: UserAccount | null;
  role: UserRole;
  usersList: UserAccount[];
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  quickLoginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  canAccessSection: (sectionIndex: number) => boolean;
  addUser: (newUser: Omit<UserAccount, "id">) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "factorymind_auth_user";
const STORAGE_KEY_USERS_LIST = "factorymind_users_db";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(INITIAL_USERS[0]); // default to Admin
  const [usersList, setUsersList] = useState<UserAccount[]>(INITIAL_USERS);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedList = localStorage.getItem(STORAGE_KEY_USERS_LIST);

      if (savedList) {
        setUsersList(JSON.parse(savedList));
      }
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Error restoring session:", e);
    }
  }, []);

  const saveUserSession = (currentUser: UserAccount | null) => {
    setUser(currentUser);
    if (typeof window !== "undefined") {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
  };

  const saveUsersList = (list: UserAccount[]) => {
    setUsersList(list);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(list));
    }
  };

  const login = async (email: string, overrideRole?: UserRole): Promise<boolean> => {
    const existing = usersList.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      const updated = overrideRole ? { ...existing, role: overrideRole } : existing;
      saveUserSession(updated);
      return true;
    }

    const roleToAssign = overrideRole || "USER";
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: roleToAssign,
      title: roleToAssign === "ADMIN" ? "System Administrator" : roleToAssign === "SUPERVISOR" ? "Floor Supervisor" : "Operator",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      department: "Plant Operations",
      status: "Active",
      lastActive: "Just now",
      machinesManaged: roleToAssign === "ADMIN" ? 26 : roleToAssign === "SUPERVISOR" ? 12 : 4,
    };
    saveUsersList([...usersList, newUser]);
    saveUserSession(newUser);
    return true;
  };

  const quickLoginAsRole = (targetRole: UserRole) => {
    const found = usersList.find((u) => u.role === targetRole) || INITIAL_USERS.find((u) => u.role === targetRole) || INITIAL_USERS[0];
    saveUserSession(found);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = {
      ...user,
      role: newRole,
      title:
        newRole === "ADMIN"
          ? "Factory Director & AI Admin"
          : newRole === "SUPERVISOR"
          ? "Plant Floor Shift Supervisor"
          : "Senior Machine Operator",
    };
    saveUserSession(updated);
    const updatedList = usersList.map((u) => (u.id === user.id ? updated : u));
    saveUsersList(updatedList);
  };

  const logout = () => {
    saveUserSession(null);
  };

  const canAccessSection = (sectionIndex: number): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions ? permissions.allowedSections.includes(sectionIndex) : false;
  };

  const addUser = (newUser: Omit<UserAccount, "id">) => {
    const created: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      lastActive: "Just now",
    };
    const updated = [created, ...usersList];
    saveUsersList(updated);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const updated = usersList.map((u) =>
      u.id === userId
        ? {
            ...u,
            role: newRole,
            title:
              newRole === "ADMIN"
                ? "System Administrator"
                : newRole === "SUPERVISOR"
                ? "Floor Supervisor"
                : "Machine Operator",
          }
        : u
    );
    saveUsersList(updated);
    if (user && user.id === userId) {
      setUser(updated.find((u) => u.id === userId) || null);
    }
  };

  const toggleUserStatus = (userId: string) => {
    const updated = usersList.map((u) =>
      u.id === userId
        ? {
            ...u,
            status: (u.status === "Active" ? "Idle" : "Active") as "Active" | "Idle" | "Offline",
          }
        : u
    );
    saveUsersList(updated);
  };

  const deleteUser = (userId: string) => {
    const updated = usersList.filter((u) => u.id !== userId);
    saveUsersList(updated);
  };

  const currentRole: UserRole = user?.role || "USER";

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        usersList,
        isAuthenticated: !!user,
        login,
        quickLoginAsRole,
        switchRole,
        logout,
        canAccessSection,
        addUser,
        updateUserRole,
        toggleUserStatus,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
