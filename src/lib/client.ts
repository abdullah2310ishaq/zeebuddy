"use server"

import { PrismaClient } from "@prisma/client"
// import { withOptimize } from "@prisma/extension-optimize";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

export const getPrismaClient = async (): Promise<PrismaClient> => {
    const prisma = global.prisma || new PrismaClient()
    global.prisma = prisma

    return prisma
}
// export const getPrismaClient = async () => {
//   return new PrismaClient().$extends(withOptimize({ apiKey: '' }));
// }


