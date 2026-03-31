import type { Prisma } from "@prisma/client";

export function getActiveSectionWhere(): Prisma.SectionWhereInput {
  return {
    OR: [
      { deletedAt: null },
      { deletedAt: { isSet: false } },
    ],
  };
}
