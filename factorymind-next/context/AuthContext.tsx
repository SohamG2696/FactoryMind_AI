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
  fixedClearance?: boolean; // Cannot be deleted or modified (Fixed plant leadership)
}

/**
 * FIXED PLANT PERSONNEL:
 *  - Exactly 4 Administrator Logins (Plant Leadership & Executive Directors)
 *  - Exactly 4 Supervisor Logins (Shift & Department Line Supervisors)
 *  - Dedicated Operator Accounts
 */
export const INITIAL_USERS: UserAccount[] = [
  // ─── 4 ADMINISTRATOR ACCOUNTS ─────────────────────────────────────────────
  {
    id: "usr-admin-01",
    name: "Dr. Rajesh Nair",
    email: "director.nair@factorymind.ai",
    role: "ADMIN",
    title: "Plant Director & General Manager",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "Plant Leadership & Executive Command",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-02",
    name: "Sarah Jenkins",
    email: "coo.jenkins@factorymind.ai",
    role: "ADMIN",
    title: "Chief Operations Officer (COO)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Manufacturing Operations & Strategy",
    status: "Active",
    lastActive: "4 min ago",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-03",
    name: "Vikram Malhotra",
    email: "head.ai@factorymind.ai",
    role: "ADMIN",
    title: "Head of Digital Twin & AI Systems",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "AI Infrastructure & ML Workbench",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-04",
    name: "Elena Rostova",
    email: "safety.elena@factorymind.ai",
    role: "ADMIN",
    title: "Chief Safety & Industrial Compliance Officer",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    department: "Industrial Safety & Plant Integrity",
    status: "Active",
    lastActive: "12 min ago",
    machinesManaged: 26,
    fixedClearance: true,
  },

  // ─── 4 SUPERVISOR ACCOUNTS ────────────────────────────────────────────────
  {
    id: "usr-super-01",
    name: "Marcus Vance",
    email: "shift.vance@factorymind.ai",
    role: "SUPERVISOR",
    title: "Senior Shift-A Production Supervisor",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    department: "CNC Machining & Line 1 Assembly",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 16,
    fixedClearance: true,
  },
  {
    id: "usr-super-02",
    name: "Priya Sharma",
    email: "qa.priya@factorymind.ai",
    role: "SUPERVISOR",
    title: "QA & Metrology Lead Supervisor",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    department: "Quality Assurance & Defect Inspection",
    status: "Active",
    lastActive: "5 min ago",
    machinesManaged: 14,
    fixedClearance: true,
  },
  {
    id: "usr-super-03",
    name: "David Miller",
    email: "maint.miller@factorymind.ai",
    role: "SUPERVISOR",
    title: "Predictive Maintenance Lead Supervisor",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    department: "Hydraulics, Robotics & PM Teams",
    status: "Active",
    lastActive: "18 min ago",
    machinesManaged: 18,
    fixedClearance: true,
  },
  {
    id: "usr-super-04",
    name: "Amara Patel",
    email: "logistics.amara@factorymind.ai",
    role: "SUPERVISOR",
    title: "Warehouse Automation & Logistics Supervisor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    department: "Automated Warehousing & AGV Fleet",
    status: "Active",
    lastActive: "22 min ago",
    machinesManaged: 12,
    fixedClearance: true,
  },

  // ─── OPERATOR ACCOUNTS ────────────────────────────────────────────────────
  {
    id: "usr-op-01",
    name: "Karan Johar",
    email: "karan.operator@factorymind.ai",
    role: "USER",
    title: "Lead CNC Operator",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    department: "CNC Precision Line",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 4,
  },
  {
    id: "usr-op-02",
    name: "Lucas Silva",
    email: "lucas.operator@factorymind.ai",
    role: "USER",
    title: "Robotics & Tooling Technician",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    department: "Robotics Workcell Beta",
    status: "Active",
    lastActive: "35 min ago",
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
    canManageUsers: false,
    canEditSettings: false,
    canTrainModels: false,
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
  adminAccounts: UserAccount[];
  supervisorAccounts: UserAccount[];
  operatorAccounts: UserAccount[];
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  selectUserAccount: (account: UserAccount) => void;
  quickLoginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  canAccessSection: (sectionIndex: number) => boolean;
  addUser: (newUser: Omit<UserAccount, "id">) => boolean;
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "factorymind_auth_user_v2";
const STORAGE_KEY_USERS_LIST = "factorymind_users_db_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(INITIAL_USERS[0]); // default to first Admin
  const [usersList, setUsersList] = useState<UserAccount[]>(INITIAL_USERS);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedList = localStorage.getItem(STORAGE_KEY_USERS_LIST);

      if (savedList) {
        const parsed: UserAccount[] = JSON.parse(savedList);
        // Ensure the 4 admins and 4 supervisors are always present
        const fixedIds = new Set(INITIAL_USERS.map((u) => u.id));
        const merged = [
          ...INITIAL_USERS,
          ...parsed.filter((u) => !fixedIds.has(u.id)),
        ];
        setUsersList(merged);
      } else {
        setUsersList(INITIAL_USERS);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Error restoring session:", e);
      setUsersList(INITIAL_USERS);
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

  const selectUserAccount = (account: UserAccount) => {
    saveUserSession(account);
  };

  const login = async (email: string, requestedRole?: UserRole): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = usersList.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      saveUserSession(existing);
      return true;
    }

    // Security Rule: Administrator and Supervisor accounts are fixed and limited to the 4 pre-assigned roles
    if (requestedRole === "ADMIN" || requestedRole === "SUPERVISOR") {
      throw new Error(
        `Direct registration is restricted for ${requestedRole}. Only pre-assigned plant personnel can access this role.`
      );
    }

    // New accounts are registered as Operator (USER)
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      role: "USER",
      title: "Machine Operator",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      department: "Plant Operations",
      status: "Active",
      lastActive: "Just now",
      machinesManaged: 4,
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
    const target = usersList.find((u) => u.role === newRole) || INITIAL_USERS.find((u) => u.role === newRole);
    if (target) {
      saveUserSession(target);
    }
  };

  const logout = () => {
    saveUserSession(null);
  };

  const canAccessSection = (sectionIndex: number): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions ? permissions.allowedSections.includes(sectionIndex) : false;
  };

  const addUser = (newUser: Omit<UserAccount, "id">): boolean => {
    // Only operator/user accounts can be added
    if (newUser.role === "ADMIN" || newUser.role === "SUPERVISOR") {
      return false;
    }
    const created: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      lastActive: "Just now",
    };
    const updated = [created, ...usersList];
    saveUsersList(updated);
    return true;
  };

  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return false;
    
    // Fixed leadership accounts cannot be downgraded or altered
    if (target.fixedClearance) {
      return false;
    }

    // New accounts cannot be elevated to Admin or Supervisor
    if (newRole === "ADMIN" || newRole === "SUPERVISOR") {
      return false;
    }

    const updated = usersList.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    saveUsersList(updated);
    return true;
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

  const deleteUser = (userId: string): boolean => {
    const target = usersList.find((u) => u.id === userId);
    if (target?.fixedClearance) {
      return false; // Cannot delete fixed plant leadership
    }
    const updated = usersList.filter((u) => u.id !== userId);
    saveUsersList(updated);
    return true;
  };

  const currentRole: UserRole = user?.role || "ADMIN";
  const adminAccounts = usersList.filter((u) => u.role === "ADMIN");
  const supervisorAccounts = usersList.filter((u) => u.role === "SUPERVISOR");
  const operatorAccounts = usersList.filter((u) => u.role === "USER");

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        usersList,
        adminAccounts,
        supervisorAccounts,
        operatorAccounts,
        isAuthenticated: !!user,
        login,
        selectUserAccount,
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
