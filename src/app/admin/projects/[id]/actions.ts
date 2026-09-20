"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewFinance } from "@/lib/roles";
import { hasAllocatedMaterial } from "@/lib/rules";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function requireFinanceAccess() {
  const session = await requireSession();
  if (!canViewFinance(session.user.role)) {
    throw new Error("You do not have permission to view or edit finance data.");
  }
  return session;
}

// Subsidy tracking is a Liaison responsibility per the PRD, not pure finance —
// only workers (limited to attendance/tasks) are excluded.
async function requireNonWorker() {
  const session = await requireSession();
  if (session.user.role === "WORKER") {
    throw new Error("You do not have permission to edit subsidy details.");
  }
  return session;
}

export async function updateProjectStage(stageId: string, formData: FormData) {
  await requireSession();
  const stage = await prisma.projectStage.findUniqueOrThrow({ where: { id: stageId } });
  const status = formData.get("status") as string;
  const blockedReason = (formData.get("blockedReason") as string) || null;
  const targetDate = formData.get("targetDate") ? new Date(formData.get("targetDate") as string) : null;

  if (status === "BLOCKED" && !blockedReason) {
    throw new Error("A reason is required to mark a stage as blocked.");
  }

  if (stage.requiresAllocation && (status === "IN_PROGRESS" || status === "DONE")) {
    const allocated = await hasAllocatedMaterial(stage.projectId);
    if (!allocated) {
      throw new Error(
        `"${stage.name}" requires material to be allocated to the project before it can move to ${status}. Allocate stock first.`
      );
    }
  }

  await prisma.projectStage.update({
    where: { id: stageId },
    data: {
      status: status as never,
      blockedReason: status === "BLOCKED" ? blockedReason : null,
      targetDate,
      startDate: status === "IN_PROGRESS" && !stage.startDate ? new Date() : undefined,
      completedDate: status === "DONE" ? new Date() : null,
    },
  });
  revalidatePath(`/admin/projects/${stage.projectId}`);
}

export async function updateApprovalStep(stepId: string, formData: FormData) {
  await requireSession();
  const step = await prisma.approvalStep.findUniqueOrThrow({ where: { id: stepId } });

  const status = formData.get("status") as string;
  const officerId = (formData.get("officerId") as string) || null;
  const arnNumber = (formData.get("arnNumber") as string) || null;
  const submissionDateRaw = formData.get("submissionDate") as string;
  const submissionDate = submissionDateRaw ? new Date(submissionDateRaw) : step.submissionDate;
  const responseNotes = (formData.get("responseNotes") as string) || null;
  const deficiencyNotes = (formData.get("deficiencyNotes") as string) || null;
  const approvalDateRaw = formData.get("approvalDate") as string;
  const approvalDate = approvalDateRaw ? new Date(approvalDateRaw) : status === "APPROVED" ? new Date() : null;

  const dueDate = submissionDate ? new Date(submissionDate.getTime() + step.slaDays * 24 * 60 * 60 * 1000) : null;

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: { status: status as never, officerId, arnNumber, submissionDate, responseNotes, deficiencyNotes, approvalDate, dueDate },
  });
  revalidatePath(`/admin/projects/${step.projectId}`);
}

export async function upsertDocumentItem(projectId: string, formData: FormData) {
  await requireSession();
  const id = formData.get("id") as string | null;
  const type = formData.get("type") as string;
  const status = formData.get("status") as string;
  const remarks = (formData.get("remarks") as string) || null;

  if (id) {
    await prisma.documentItem.update({
      where: { id },
      data: { status: status as never, remarks, uploadedAt: status !== "PENDING" ? new Date() : null },
    });
  } else {
    await prisma.documentItem.create({
      data: { projectId, type, status: status as never, remarks, uploadedAt: status !== "PENDING" ? new Date() : null },
    });
  }
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateSubsidy(projectId: string, formData: FormData) {
  await requireNonWorker();
  const isEligible = formData.get("isEligible") === "on";
  const expectedAmount = parseFloat(formData.get("expectedAmount") as string);
  const claimDate = formData.get("claimDate") ? new Date(formData.get("claimDate") as string) : null;
  const referenceNumber = (formData.get("referenceNumber") as string) || null;
  const receivedDate = formData.get("receivedDate") ? new Date(formData.get("receivedDate") as string) : null;
  const isDbtToCustomer = formData.get("isDbtToCustomer") === "on";

  await prisma.subsidy.upsert({
    where: { projectId },
    update: { isEligible, expectedAmount, claimDate, referenceNumber, receivedDate, isDbtToCustomer },
    create: { projectId, isEligible, expectedAmount, claimDate, referenceNumber, receivedDate, isDbtToCustomer },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addCostEntry(projectId: string, formData: FormData) {
  const session = await requireFinanceAccess();
  await prisma.costEntry.create({
    data: {
      projectId,
      category: formData.get("category") as never,
      amount: parseFloat(formData.get("amount") as string),
      description: (formData.get("description") as string) || null,
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
      enteredById: session.user.id,
    },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addClientInvoice(projectId: string, formData: FormData) {
  await requireFinanceAccess();
  await prisma.clientInvoice.create({
    data: {
      projectId,
      invoiceNumber: formData.get("invoiceNumber") as string,
      milestoneType: formData.get("milestoneType") as never,
      amount: parseFloat(formData.get("amount") as string),
      status: (formData.get("status") as string) as never,
      issueDate: formData.get("issueDate") ? new Date(formData.get("issueDate") as string) : new Date(),
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null,
      description: (formData.get("description") as string) || null,
    },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addPayment(projectId: string, formData: FormData) {
  const session = await requireFinanceAccess();
  const clientInvoiceId = formData.get("clientInvoiceId") as string;
  const amount = parseFloat(formData.get("amount") as string);

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        clientInvoiceId,
        amount,
        date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
        mode: formData.get("mode") as never,
        referenceNumber: (formData.get("referenceNumber") as string) || null,
        recordedById: session.user.id,
      },
    });

    const invoice = await tx.clientInvoice.findUniqueOrThrow({
      where: { id: clientInvoiceId },
      include: { payments: true },
    });
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    await tx.clientInvoice.update({
      where: { id: clientInvoiceId },
      data: { status: totalPaid >= invoice.amount ? "PAID" : "PARTIALLY_PAID" },
    });
  });

  revalidatePath(`/admin/projects/${projectId}`);
}
