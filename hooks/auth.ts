import { getProfile } from "@/lib/actions/user.actions";
import { Profile } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

/**
 * Custom hook to fetch the profile of the currently authenticated user.
 * @returns An object containing the profile data or null if not found.
 * @throws Will throw an error if the user is not authenticated or if there is an issue fetching the profile.
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClientComponentClient();
  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) throw new Error("No user found");

      const profileData = await getProfile(user.id);
      console.log("Profile data fetched:", profileData);
      setProfile(profileData);
    })();
  }, [supabase.auth]);

  return { profile: profile! };
};
