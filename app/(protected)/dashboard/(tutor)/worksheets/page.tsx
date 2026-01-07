import WorksheetsList from "@/components/tutor/WorksheetsList";
import { createClient } from "@/lib/supabase/server";

const Worksheets = async () => {
  const supabase = await createClient()
  const fetchFiles = await await supabase.storage.from("worksheets").list("")
  
  return (
    <>
      <WorksheetsList files = {fetchFiles}/>
    </>
  );
};

export default Worksheets;


