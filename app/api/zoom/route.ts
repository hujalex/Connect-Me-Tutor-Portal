import type { NextApiRequest, NextApiResponse } from 'next';
import * as KJUR from 'jsrsasign';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const iat = Math.floor(Date.now() / 1000) - 30; // Current time in seconds
      const exp = iat + 60 * 60 * 2; // 2 hours later

      const Header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const Payload = {
        sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY,
        mn: req.body.meetingNumber,
        role: req.body.role,
        iat: iat,
        exp: exp
      };

      const sHeader = JSON.stringify(Header);
      const sPayload = JSON.stringify(Payload);

      const meetingSignature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.NEXT_PUBLIC_ZOOM_SDK_SECRET);

      res.status(200).json({
        signature: meetingSignature,
        sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY
      });
    } catch (error) {
      console.error('Error generating Zoom signature:', error);
      res.status(500).json({ error: 'Error generating Zoom signature' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
