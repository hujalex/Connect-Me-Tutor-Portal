'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analyzeAndTransformStudents, migrateSelectedStudents,
    type Profile  } from '@/lib/actions/migrate.actions';



const ITEMS_PER_PAGE = 10;

const formatAvailability = (availability: Profile['availability']): string => {
    return availability
      .map(slot => `${slot.day} ${slot.startTime}-${slot.endTime}`)
      .join(', ');
};

const MigrateDataPage: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [students, setStudents] = useState<Profile[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [migrationStatus, setMigrationStatus] = useState('');

  const totalPages = Math.ceil(students?.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentStudents = students?.slice(startIndex, endIndex);

  const handleMigrateClick = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const fetchedStudents = await analyzeAndTransformStudents();
      if (fetchedStudents) {
        setStudents(fetchedStudents.data as Profile[]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setMigrationStatus('Failed to fetch students. Please try again.');
    }
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === currentStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(currentStudents.map((_, index) => startIndex + index)));
    }
  };

  const toggleSelectStudent = (index: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedStudents(newSelected);
  };

  const handleConfirmMigration = async () => {
    setLoading(true);
    setError(null);
    setMigrationStatus('Migrating selected students...');
    
    try {
      const selectedStudentData = Array.from(selectedStudents).map(index => students[index]);
      const response = await migrateSelectedStudents(selectedStudentData);
      
      if (response.success) {
        setMigrationStatus(`Successfully migrated ${response.migratedCount} students!`);
        setTimeout(() => {
          setIsOpen(false);
          setStudents([]);
          setSelectedStudents(new Set());
          setMigrationStatus('');
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      setError(errorMessage);
      setMigrationStatus('Migration failed. Please try again.');
      console.error('Migration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Migrate Data</h1>
      
      <Button 
        onClick={handleMigrateClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Migrate Students'
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Migration</DialogTitle>
            <DialogDescription>
              Select the students you want to migrate to the system.
            </DialogDescription>
          </DialogHeader>

          {students?.length > 0 ? (
            <>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                        <Checkbox 
                            checked={selectedStudents.size === currentStudents.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all students"
                        />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Parent Info</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {currentStudents.map((student, index) => (
                        <TableRow key={student.id}>
                        <TableCell>
                            <Checkbox 
                            checked={selectedStudents.has(startIndex + index)}
                            onCheckedChange={() => toggleSelectStudent(startIndex + index)}
                            aria-label={`Select ${student.firstName} ${student.lastName}`}
                            />
                        </TableCell>
                        <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.subjectsOfInterest.join(', ')}</TableCell>
                        <TableCell>{formatAvailability(student.availability)}</TableCell>
                        <TableCell>
                            {student.parentName && (
                            <div className="text-sm">
                                <div>{student.parentName}</div>
                                {student.parentEmail && <div>{student.parentEmail}</div>}
                                {student.parentPhone && <div>{student.parentPhone}</div>}
                            </div>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      aria-disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <p className="text-center p-8">No students found</p>
          )}

          {migrationStatus && (
            <p className="text-center text-sm text-muted-foreground">
              {migrationStatus}
            </p>
          )}

          <DialogFooter>
            <Button
              onClick={handleConfirmMigration}
              disabled={loading || selectedStudents.size === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Migrate Selected (${selectedStudents.size})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MigrateDataPage;