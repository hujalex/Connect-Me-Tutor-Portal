"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { fetchScheduledMessages } from "@/lib/actions/email.server.actions";

const EmailManager = () => {
  const sendEmail = async () => {
    try {
      const now = new Date();

      const response = await fetch(
        "/api/email/before-sessions/schedule-reminders-weekly",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }

      toast.success("Email sent");
    } catch (error) {
      toast.error(
        `${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.error("Unable to send email", error);
    }
  };

  const listScheduledMessages = async () => {
    try {
      const response = await fetch("/api/qstash/schedules");
      const data = await response.json();
    } catch (error) {
      console.error("Error listing messages:", error);
      toast.error("Failed to fetch schedules");
    }
  };

  return (
    <>
      <Toaster />

      <main className="p-8">
        <h1 className="text-3xl font-bold mb-6">Email Manager</h1>
        <Button onClick={() => sendEmail()}>Send Email</Button>
        <Button onClick={() => listScheduledMessages()}>Show schedules</Button>
      </main>
    </>
  );
};

export default EmailManager;
