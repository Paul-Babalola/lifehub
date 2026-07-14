import { useState, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'PASSWORD_RECOVERY') setIsRecoveryMode(true);
        if (event === 'USER_UPDATED') setIsRecoveryMode(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  const signInWithEmail = (email: string, password: string) =>
    supabase?.auth.signInWithPassword({ email, password });

  const resetPassword = (email: string) =>
    supabase?.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

  const updateProfile = (firstName: string, lastName: string) =>
    supabase?.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });

  const setNewPassword = (password: string) =>
    supabase?.auth.updateUser({ password });

  const signUpWithEmail = (email: string, password: string, firstName: string, lastName: string) =>
    supabase?.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });

  const signOut = () => supabase?.auth.signOut();

  const user: User | null = session?.user ?? null;

  const displayName = (() => {
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    if (meta.first_name) return `${meta.first_name} ${meta.last_name ?? ""}`.trim();
    if (meta.full_name) return meta.full_name as string;
    if (meta.name) return meta.name as string;
    return user.email?.split("@")[0] ?? null;
  })();

  const firstName = (() => {
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    if (meta.first_name) return meta.first_name as string;
    if (meta.full_name) return (meta.full_name as string).split(" ")[0];
    if (meta.name) return (meta.name as string).split(" ")[0];
    return user.email?.split("@")[0] ?? null;
  })();

  return {
    user,
    session,
    loading,
    isRecoveryMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    setNewPassword,
    updateProfile,
    signOut,
    displayName,
    firstName,
    isSupabaseConfigured: supabase !== null,
  };
}
