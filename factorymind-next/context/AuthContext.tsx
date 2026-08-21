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
  password?: string; // Account security password (Format: Name@123)
}

export function getExpectedPasswordForName(name: string): string {
  const firstName = name.trim().split(" ")[0] || "User";
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  return `${capitalized}@123`;
}

export function validateAccountPassword(account: UserAccount, passwordInput: string): boolean {
  if (!passwordInput) return false;
  const expected = account.password || getExpectedPasswordForName(account.name);
  return passwordInput.trim() === expected;
}

/**
 * FIXED PLANT PERSONNEL WITH SECURE PASSWORDS (Name@123):
 *  - 4 Administrator Logins (Plant Leadership & Executive Directors)
 *  - 4 Supervisor Logins (Shift & Department Line Supervisors)
 *  - Dedicated Operator Accounts
 */
export const INITIAL_USERS: UserAccount[] = [
  // ─── 4 ADMINISTRATOR ACCOUNTS ─────────────────────────────────────────────
  {
    id: "usr-admin-01",
    name: "Soham Gaikwad",
    email: "soham.gaikwad@factorymind.ai",
    password: "Soham@123",
    role: "ADMIN",
    title: "Plant Director & General Manager",
    avatar: "https://ui-avatars.com/api/?name=Soham+Gaikwad&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "Plant Leadership & Executive Command",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-02",
    name: "Maitrey Bharambe",
    email: "maitrey.bharambe@factorymind.ai",
    password: "Maitrey@123",
    role: "ADMIN",
    title: "Chief Operations Officer (COO)",
    avatar: "https://ui-avatars.com/api/?name=Maitrey+Bharambe&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "Manufacturing Operations & Strategy",
    status: "Active",
    lastActive: "4 min ago",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-03",
    name: "Om Wagale",
    email: "om.wagale@factorymind.ai",
    password: "Om@123",
    role: "ADMIN",
    title: "Head of Digital Twin & AI Systems",
    avatar: "https://ui-avatars.com/api/?name=Om+Wagale&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
    department: "AI Infrastructure & ML Workbench",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 26,
    fixedClearance: true,
  },
  {
    id: "usr-admin-04",
    name: "Harsh Savnerkar",
    email: "harsh.savnerkar@factorymind.ai",
    password: "Harsh@123",
    role: "ADMIN",
    title: "Chief Safety & Industrial Compliance Officer",
    avatar: "https://ui-avatars.com/api/?name=Harsh+Savnerkar&background=1c1917&color=f59e0b&bold=true&rounded=true&size=150",
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
    password: "Marcus@123",
    role: "SUPERVISOR",
    title: "Senior Shift-A Production Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Vance&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
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
    password: "Priya@123",
    role: "SUPERVISOR",
    title: "QA & Metrology Lead Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
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
    password: "David@123",
    role: "SUPERVISOR",
    title: "Predictive Maintenance Lead Supervisor",
    avatar: "https://ui-avatars.com/api/?name=David+Miller&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
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
    password: "Amara@123",
    role: "SUPERVISOR",
    title: "Warehouse Automation & Logistics Supervisor",
    avatar: "https://ui-avatars.com/api/?name=Amara+Patel&background=042f2e&color=22d3ee&bold=true&rounded=true&size=150",
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
    password: "Karan@123",
    role: "USER",
    title: "Lead CNC Operator",
    avatar: "https://ui-avatars.com/api/?name=Karan+Johar&background=022c22&color=34d399&bold=true&rounded=true&size=150",
    department: "CNC Precision Line",
    status: "Active",
    lastActive: "Just now",
    machinesManaged: 4,
  },
  {
    id: "usr-op-02",
    name: "Lucas Silva",
    email: "lucas.operator@factorymind.ai",
    password: "Lucas@123",
    role: "USER",
    title: "Robotics & Tooling Technician",
    avatar: "https://ui-avatars.com/api/?name=Lucas+Silva&background=022c22&color=34d399&bold=true&rounded=true&size=150",
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
    allowedSections: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Full Access to all 11 sections
    canManageUsers: true,
    canEditSettings: true,
    canTrainModels: true,
    canOverrideSafety: true,
  },
  SUPERVISOR: {
    name: "Supervisor",
    badge: "SUPERVISOR",
    color: "#06b6d4", // Cyan
    allowedSections: [0, 1, 2, 4, 5, 6, 7, 8], // Operations, Digital Twin, Floor AI, Machines, Analytics, Maintenance, Alerts, Reports
    canManageUsers: false,
    canEditSettings: false,
    canTrainModels: false,
    canOverrideSafety: false,
  },
  USER: {
    name: "User (Operator)",
    badge: "USER",
    color: "#10b981", // Emerald
    allowedSections: [0, 1, 4, 6, 7], // Operator Dashboard, Assigned Cell Digital Twin, Machine Controls, Shift Maintenance Checklist, Cell Alerts
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
  login: (email: string, targetRole?: UserRole) => Promise<boolean>;
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

const STORAGE_KEY_USER = "factorymind_auth_user_v5";
const STORAGE_KEY_USERS_LIST = "factorymind_users_db_v5";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(INITIAL_USERS[0]); // default to first Admin (Soham Gaikwad)
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
      } else {
        setUser(INITIAL_USERS[0]);
      }
    } catch (e) {
      console.warn("Error restoring session:", e);
      setUsersList(INITIAL_USERS);
      setUser(INITIAL_USERS[0]);
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

  const saveUsersList = (newList: UserAccount[]) => {
    setUsersList(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(newList));
    }
  };

  const currentRole: UserRole = user?.role || "ADMIN";

  const adminAccounts = usersList.filter((u) => u.role === "ADMIN");
  const supervisorAccounts = usersList.filter((u) => u.role === "SUPERVISOR");
  const operatorAccounts = usersList.filter((u) => u.role === "USER");

  const login = async (email: string, targetRole: UserRole = "USER"): Promise<boolean> => {
    const existing = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      saveUserSession(existing);
      return true;
    }

    const userName = email.split("@")[0].replace(".", " ").toUpperCase();
    const newAccount: UserAccount = {
      id: `usr-custom-${Date.now()}`,
      name: userName,
      email,
      password: getExpectedPasswordForName(userName),
      role: targetRole === "ADMIN" || targetRole === "SUPERVISOR" ? "USER" : targetRole,
      title: "Floor Operator & Technician",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=022c22&color=34d399&bold=true&rounded=true&size=150`,
      department: "Plant Operations",
      status: "Active",
      lastActive: "Just now",
      machinesManaged: 4,
    };

    const updated = [...usersList, newAccount];
    saveUsersList(updated);
    saveUserSession(newAccount);
    return true;
  };

  const selectUserAccount = (account: UserAccount) => {
    saveUserSession(account);
  };

  const quickLoginAsRole = (targetRole: UserRole) => {
    const match = usersList.find((u) => u.role === targetRole) || INITIAL_USERS.find((u) => u.role === targetRole);
    if (match) {
      saveUserSession(match);
    }
  };

  const switchRole = (newRole: UserRole) => {
    const matchingAccount = usersList.find((u) => u.role === newRole) || INITIAL_USERS.find((u) => u.role === newRole);
    if (matchingAccount) {
      saveUserSession(matchingAccount);
    } else if (user) {
      const updatedUser = { ...user, role: newRole };
      saveUserSession(updatedUser);
    }
  };

  const logout = () => {
    saveUserSession(null);
  };

  const canAccessSection = (sectionIndex: number): boolean => {
    const allowed = ROLE_PERMISSIONS[currentRole]?.allowedSections || [];
    return allowed.includes(sectionIndex);
  };

  const addUser = (newUserData: Omit<UserAccount, "id">): boolean => {
    const newAccount: UserAccount = {
      ...newUserData,
      id: `usr-${Date.now()}`,
      role: "USER",
      password: getExpectedPasswordForName(newUserData.name),
    };
    const updated = [...usersList, newAccount];
    saveUsersList(updated);
    return true;
  };

  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    const target = usersList.find((u) => u.id === userId);
    if (!target || target.fixedClearance) return false;

    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    saveUsersList(updated);
    if (user?.id === userId) {
      saveUserSession({ ...user, role: newRole });
    }
    return true;
  };

  const toggleUserStatus = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === "Active" ? "Idle" : u.status === "Idle" ? "Offline" : "Active";
        return { ...u, status: nextStatus as "Active" | "Idle" | "Offline" };
      }
      return u;
    });
    saveUsersList(updated);
    if (user?.id === userId) {
      const activeStatus = updated.find((u) => u.id === userId)?.status || "Active";
      saveUserSession({ ...user, status: activeStatus });
    }
  };

  const deleteUser = (userId: string): boolean => {
    const target = usersList.find((u) => u.id === userId);
    if (target?.fixedClearance) return false;

    const updated = usersList.filter((u) => u.id !== userId);
    saveUsersList(updated);
    if (user?.id === userId) {
      saveUserSession(INITIAL_USERS[0]);
    }
    return true;
  };

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
