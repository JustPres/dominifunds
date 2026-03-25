"use client";

import { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import RecordPaymentDialog from "./RecordPaymentDialog";
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

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = transactions.slice(startIndex, startIndex + pageSize);

  if (transactions.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:transfer-horizontal-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No transactions recorded yet.</h3>
        <p className="mt-2 text-sm text-[#625f5f]">Keep track of organizational payments here.</p>
        <div className="mt-6">
          <RecordPaymentDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left font-body text-sm">
            <thead>
              <tr className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50">
                <th className="py-4 pl-6 pr-4 font-semibold text-[#625f5f]">#</th>
                <th className="px-4 py-4 font-semibold text-[#625f5f]">Member</th>
                <th className="px-4 py-4 font-semibold text-[#625f5f]">Fund Type</th>
                <th className="px-4 py-4 font-semibold text-[#625f5f]">Installment Info</th>
                <th className="px-4 py-4 text-right font-semibold text-[#625f5f]">Amount</th>
                <th className="px-4 py-4 font-semibold text-[#625f5f]">Date</th>
                <th className="px-4 py-4 font-semibold text-[#625f5f]">Note</th>
                <th className="py-4 pl-4 pr-6 text-center font-semibold text-[#625f5f]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECEC]">
              {currentData.map((transaction, index) => {
                const globalIndex = transactions.length - (startIndex + index);
                const paddedIndex = globalIndex.toString().padStart(3, "0");

                return (
                  <tr key={transaction.id} className="transition-colors hover:bg-[#F9F7F6]">
                    <td className="py-4 pl-6 pr-4 font-medium text-[#625f5f]/70">{paddedIndex}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/5">
                          <span className="text-[10px] font-bold text-[#3D0808]">{transaction.memberInitials}</span>
                        </div>
                        <span className="font-medium text-[#343434]">{transaction.memberName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-[#343434]">{transaction.fundTypeName}</span>
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            transaction.type === "FULL_PAYMENT"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {transaction.type.replace("_", " ")}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[13px] font-medium text-[#625f5f]">
                      {transaction.installmentInfo || "-"}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-display text-[15px] font-bold text-[#a12124]">
                        {currencyFormatter.format(transaction.amount)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[13px] font-medium text-[#343434]">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </td>

                    <td className="px-4 py-4 text-[12px] italic text-[#625f5f]">{transaction.note || "-"}</td>

                    <td className="py-4 pl-4 pr-6 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          transaction.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : transaction.status === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <Pagination className="mt-2 font-body text-[#343434]">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage > 1) setCurrentPage((page) => page - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;

              if (pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - currentPage) <= 1) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage(pageNumber);
                      }}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              if (Math.abs(pageNumber - currentPage) === 2) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return null;
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage < totalPages) setCurrentPage((page) => page + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
