'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {tutorResources} from '@/constants/tutor'; // Importing the resources JSON array

interface Resource {
    title: string;
    link:string;
    subject: string;
    description:string
    gradeLevel:string;
}

const ResourceList = () => {
  const [filteredResources, setFilteredResources] = useState(tutorResources);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const filtered = tutorResources.filter(resource =>
      resource.title.toLowerCase().includes(filterValue.toLowerCase()) ||
      resource.description.toLowerCase().includes(filterValue.toLowerCase())
    );
    setFilteredResources(filtered);
    setCurrentPage(1);
  }, [filterValue]);

  const totalPages = Math.ceil(filteredResources.length / rowsPerPage);

  const handlePageChange = (newPage:any) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (value:any) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tutor Resources</h1>
      
      <div className="flex space-x-6">
        <div className="flex-grow bg-white rounded-lg shadow p-6">
          
          <div className="flex justify-between items-center mb-4">
            <input 
              type="text" 
              placeholder="Filter resources..." 
              className="w-64 border p-2 rounded" 
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResources.map((resource, index) => (
                <TableRow key={index}>
                  <TableCell>{resource.title}</TableCell>
                  <TableCell>{resource.description}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(resource.link, '_blank')}
                    >
                      Open Resource
                    </Button>
                  </TableCell>
                  <TableCell>
                    {resource.type}
                  </TableCell>
                  <TableCell>
                    {resource.subject}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-between items-center">
            <span>{filteredResources.length} resource(s) total.</span>
            <div className="flex items-center space-x-2">
              <span>Rows per page</span>
              <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={rowsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                  «
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  ‹
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  ›
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                  »
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResourceList;
