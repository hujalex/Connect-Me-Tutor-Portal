import { SharedPairing } from "@/types/pairing";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export const useEnrollment = (pairingId: string) => {
  const [pairing, setPairing] = useState<SharedPairing>();
  const supabase = createClientComponentClient();
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .rpc("get_pairing_with_profiles", {
          pairing_uuid: pairingId,
        })
        .single();

      if (data) {
        setPairing(data as SharedPairing);
      }

      console.log(data, error);
    })();
  }, [supabase, pairingId]);
  return { pairing };
};
