"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

const WorksheetsList = ({
  files,
}: {
  files:
    | {
        data: any[];
        error: null;
      }
    | {
        data: null;
        error: Error;
      };
}) => {
  const [worksheets, setWorksheets] = useState<any[]>(files.data || []);

  useEffect(() => {
    if (files.error) {
      toast.error("Unable to load worksheets")
    }
  }, []);

  const downloadFile = async (path: string) => {
    const { data } = await supabase.storage.from("worksheets").download(path);
    if (!data) {
      toast.error("Worksheet nor found");
      return;
    }
    const url = URL.createObjectURL(data);
    const download = document.createElement("a");
    download.href = url;
    download.download = path;
    download.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Worksheets</h1>

      <div className="flex flex-wrap gap-6">
        {worksheets.map((file) => (
          <Card
            key={file.name}
            className="w-80 transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-semibold text-center">
                {file.name}
              </CardTitle>
            </CardHeader>

            <CardFooter>
              <div className="flex gap-3 w-full">
                <Button
                  className="w-1/2"
                  onClick={() => {
                    const { data } = supabase.storage
                      .from("worksheets")
                      .getPublicUrl(file.name);
                    window.open(data.publicUrl, "_blank");
                  }}
                >
                  Open
                </Button>
                <Button
                  className="w-1/2"
                  onClick={() => downloadFile(file.name)}
                >
                  Download
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Toaster />
    </main>
  );
};

export default WorksheetsList;
