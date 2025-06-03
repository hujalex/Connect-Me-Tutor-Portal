"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import axios, { AxiosResponse } from "axios";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getMeeting } from "@/lib/actions/meeting.actions";
import { Meeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type ParamsProps = {
  params: { meetingId: string };
};

interface ZoomResponseData {
  meetingId: string;
  joinUrl: string;
  signature: any;
  sdkKey: any;
}

const MeetingPage = ({ params }: ParamsProps) => {
  const meetingId = params.meetingId;
  console.log("MEETING ID", meetingId);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const meetingSDKElementRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getThisMeeting = async () => {
      try {
        const meetingData = await getMeeting(meetingId);
        console.log("THIS MEETING DATA", meetingData);

        if (meetingData) {
          setMeeting(meetingData);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    getThisMeeting();
  });

  return (
    <>
      {" "}
      <Toaster />{" "}
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-md p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Zoom Meeting</h2>
          {/*<div id="meetingSDKElement" ref={meetingSDKElementRef} style={{ width: '100%', height: '100%' }}>
        {/* Zoom SDK will be rendered here </div>*/}

          <div>
            {meeting?.link ? (
              <>
                {" "}
                <button
                  onClick={() => (window.location.href = `${meeting.link}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Join {`${meeting.name}`}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${meeting.link}`);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingPage;
