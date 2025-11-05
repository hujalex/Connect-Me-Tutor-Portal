import { SharedEnrollment } from "@/types/enrollment";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export const useEnrollment = (enrollmentId: string) => {
  const [enrollment, setEnrollment] = useState<SharedEnrollment>();
  const supabase = createClientComponentClient();
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .rpc("get_enrollment_with_profiles", {
          enrollment_uuid: enrollmentId,
        })
        .single();

      if (data) {
        setEnrollment(data as SharedEnrollment);
      }

    })();
  }, [supabase, enrollmentId]);
  return { enrollment };
};
