import type { Prisma } from "@prisma/client";

export function getActiveFundWhere(): Prisma.FundTypeWhereInput {
  return {
    OR: [
      { archivedAt: null },
      { archivedAt: { isSet: false } },
    ],
  };
}
