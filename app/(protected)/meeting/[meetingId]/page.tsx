'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getMeeting } from '@/lib/actions/meeting.actions'
import { Meeting } from '@/types'

type ParamsProps = {
    params:{meetingId:string}
}


interface ZoomResponseData {
  meetingId: string;
  joinUrl: string;
  signature: any;
  sdkKey: any;
}

const MeetingPage = ({params}:ParamsProps) => {

    const meetingId = params.meetingId
    console.log(meetingId)

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const meetingSDKElementRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const [loading,setLoading] = useState(false)

  useEffect(() => {
    const getThisMeeting = async () => {
      try {

        const meetingData = await getMeeting(meetingId);
        console.log('THIS MEETING DATA',meetingData)
          
        if (meetingData) {
            setMeeting(meetingData);
        }

      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    getThisMeeting();
  }, );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const zoomEmbed = await (await import('@zoomus/websdk/embedded')).default;
        let client = zoomEmbed.createClient();
        let meetingSDKElement = meetingSDKElementRef.current;

        if (meetingSDKElement) {
          client.init({
            language: 'en-US',
            zoomAppRoot: meetingSDKElement
          });

          let payload = {
            meetingNumber: meeting?.meetingId,
            // Add other payload properties if needed
          };

          const fetchZoomData = async (payload: any): Promise<ZoomResponseData | undefined> => {
            try {
              const response: AxiosResponse<ZoomResponseData> = await axios({
                url: '/api/zoom',
                method: 'post',
                data: payload,
              });
              return response.data;
            } catch (error) {
              console.error('Signature axios request error:', error);
              return undefined;
            }
          };

          const handleZoomMeeting = async (payload: any) => {
            const data = await fetchZoomData(payload);
            if (data) {
              if (meeting) {
                client.join({
                    meetingNumber: payload.meetingNumber,
                    signature: data.signature,
                    sdkKey: data.sdkKey,
                    userName: 'User', // Replace with dynamic user name
                    password: meeting?.password, // Replace with actual password if needed
                    tk: ''
                  });
              }
            } else {
              console.error('Failed to fetch Zoom data');
            }
          };

          handleZoomMeeting(payload);
        } else {
          console.error('Zoom SDK root element is not found.');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (meetingId) {
      fetchData();
    }
  }, [meetingId]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white shadow-md p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-4">Zoom Meeting</h2>
        <div id="meetingSDKElement" ref={meetingSDKElementRef} style={{ width: '100%', height: '100%' }}>
          {/* Zoom SDK will be rendered here */}
        </div>
        <div>
          {meeting?.link}
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;
