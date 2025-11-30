"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const WorksheetsList = () => {
    
  const printToConsole = () => {
    console.log("Printing to Console");
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Worksheets</h1>
      <div className="flex space-x-6">
        {/*   Include Worksheets Here  */}

        <Button onClick={() => printToConsole()}>This is a button</Button>

        {/*        End        */}
      </div>
    </main>
  );
};

export default WorksheetsList;
