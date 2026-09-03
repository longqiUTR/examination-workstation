"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateDailyTasks } from "@/lib/plan";
import { revalidatePath } from "next/cache";

export type CreatePlanInput = {
  title: string;
  targetExam: string;
  startDate: Date;
  endDate: Date;
  dailyCount: number;
};

export async function createPlan(input: CreatePlanInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const plan = await prisma.plan.create({
    data: {
      userId: session.user.id,
      title: input.title,
      targetExam: input.targetExam,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
    },
  });

  const tasks = generateDailyTasks(plan, input.dailyCount);
  await prisma.planTask.createMany({ data: tasks });

  revalidatePath("/plans");
  revalidatePath("/");
  return plan;
}

export async function listPlans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.plan.findUnique({
    where: { id, userId: session.user.id },
    include: { tasks: { orderBy: { date: "asc" } } },
  });
}

export async function archivePlan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const result = await prisma.plan.update({
    where: { id, userId: session.user.id },
    data: { status: "archived" },
  });
  revalidatePath("/plans");
  revalidatePath("/");
  return result;
}
