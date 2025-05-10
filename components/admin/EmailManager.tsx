"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

const EmailManager = () => {
  const sendEmail = async () => {
    const now = new Date();

    await fetch("/api/email/schedule-reminder", {
      method: "POST",
      body: JSON.stringify({ now }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Email Manager</h1>
      <Button onClick={() => sendEmail}>Send Email</Button>
    </main>
  );
};

export default EmailManager;
