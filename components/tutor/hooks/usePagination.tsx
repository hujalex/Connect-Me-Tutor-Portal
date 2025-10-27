// import { useState, useEffect } from "react";

// export function usePagination<T>(items: T[], initialRowsPerPage = 10) {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

//   // Reset to first page when items change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [items]);

//   const totalPages = Math.ceil(items.length / rowsPerPage);

//   const paginatedItems = items.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const handlePageChange = (newPage: number) => {
//     setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
//   };

//   const handleRowsPerPageChange = (value: string) => {
//     setRowsPerPage(parseInt(value, 10));
//     setCurrentPage(1);
//   };

//   return {
//     currentPage,
//     rowsPerPage,
//     totalPages,
//     paginatedItems,
//     handlePageChange,
//     handleRowsPerPageChange,
//   };
// }
