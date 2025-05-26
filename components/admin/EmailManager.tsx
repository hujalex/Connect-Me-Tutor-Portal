"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

const EmailManager = () => {
  const scheduleEmail = async () => {
    try {
      const now = new Date();

      const response = await fetch("/api/email/schedule-reminder", {
        method: "POST",
        body: JSON.stringify({ now }),
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  return (
    <>
      <Toaster />

      <main className="p-8">
        <h1 className="text-3xl font-bold mb-6">Email Manager</h1>
        <Button onClick={() => scheduleEmail()}>Send Email</Button>
      </main>
    </>
  );
};

export default EmailManager;
