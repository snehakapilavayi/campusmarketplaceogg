import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setAuditCollege } from "@/lib/admin";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  campus: string | null;
  account_type: string;

  verification: "pending" | "verified" | "rejected";
  swapcoin_rating: number;
  ratings_count: number;
  sales_count: number;
  transactions_count: number;
  profile_complete: boolean;
};

export type AdminRole = "super_admin" | "college_admin" | "moderator";

type AuthValue = {
  adminRole: { role: AdminRole; collegeId: string | null } | null;
  session: Session | null;
  userId: string | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  userId: null,
  loading: true,
  profile: null,
  isAdmin: false,
  isSuperAdmin: false,
  adminRole: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      return (data as Profile) ?? null;
    },
  });

  const { data: adminRole } = useQuery({
    queryKey: ["admin-role", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_admin_role");
      const row = Array.isArray(data) ? data[0] : data;
      return row ? { role: row.role as AdminRole, collegeId: (row.college_id as string | null) ?? null } : null;
    },
  });
  const isAdmin = !!adminRole;
  const isSuperAdmin = adminRole?.role === "super_admin";
  setAuditCollege(isSuperAdmin ? null : adminRole?.collegeId ?? null);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userId,
        loading,
        profile: profile ?? null,
        isAdmin,
        isSuperAdmin,
        adminRole: adminRole ?? null,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Server-resolved admin role + college scope for the signed-in user. */
export const useAdminRole = () => useContext(AuthContext).adminRole;
