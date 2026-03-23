"use client";

import { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = transactions.slice(startIndex, startIndex + pageSize);

  if (transactions.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:transfer-horizontal-bold-duotone" className="mb-4 h-16 w-16 text-[#F0ECEC]" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No transactions found</h3>
        <p className="mt-2 text-sm text-[#625f5f]">Adjust your filters or record a new payment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F0ECEC] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50">
                <th className="py-4 pl-6 pr-4 font-semibold text-[#625f5f]">#</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f]">Member</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f]">Fund Type</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f]">Installment Info</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f] text-right">Amount</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f]">Date</th>
                <th className="py-4 px-4 font-semibold text-[#625f5f]">Note</th>
                <th className="py-4 pl-4 pr-6 font-semibold text-[#625f5f] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECEC]">
              {currentData.map((tx, index) => {
                const globalIndex = transactions.length - (startIndex + index);
                const paddedIndex = globalIndex.toString().padStart(3, "0");
                
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-[#F9F7F6]">
                    <td className="py-4 pl-6 pr-4 font-medium text-[#625f5f]/70">
                      {paddedIndex}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/5">
                          <span className="text-[10px] font-bold text-[#3D0808]">
                            {tx.memberInitials}
                          </span>
                        </div>
                        <span className="font-medium text-[#343434]">{tx.memberName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-semibold text-[#343434]">{tx.fundTypeName}</span>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          tx.type === "FULL_PAYMENT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {tx.type.replace("_", " ")}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-[#625f5f] font-medium text-[13px]">
                      {tx.installmentInfo || "—"}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-display text-[15px] font-bold text-[#a12124]">
                        ₱{tx.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[#343434] text-[13px] font-medium">
                      {format(new Date(tx.date), "MMM d, yyyy")}
                    </td>

                    <td className="py-4 px-4 text-[12px] italic text-[#625f5f]">
                      {tx.note || "—"}
                    </td>

                    <td className="py-4 pl-4 pr-6 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === "PAID" ? "bg-emerald-100 text-emerald-700" : 
                        tx.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-2 text-[#343434] font-body">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(p => p - 1);
                }} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNo = i + 1;
              if (pageNo === 1 || pageNo === totalPages || Math.abs(pageNo - currentPage) <= 1) {
                return (
                  <PaginationItem key={pageNo}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNo);
                      }}
                      isActive={currentPage === pageNo}
                    >
                      {pageNo}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (Math.abs(pageNo - currentPage) === 2) {
                return <PaginationItem key={pageNo}><PaginationEllipsis /></PaginationItem>;
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(p => p + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
