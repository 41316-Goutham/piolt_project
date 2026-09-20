import { prisma } from "@/lib/prisma";
import { updateStageTemplateStep, updateApprovalTemplateStep } from "./actions";
import Link from "next/link";

export default async function TemplatesPage() {
  const [stageTemplates, approvalTemplates] = await Promise.all([
    prisma.stageTemplate.findMany({ include: { steps: { orderBy: { order: "asc" } } } }),
    prisma.approvalTemplate.findMany({ include: { steps: { orderBy: { order: "asc" } } } }),
  ]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Edit stage and approval workflows without code changes. New projects use these on creation.
          </p>
        </div>
        <Link href="/admin/settings/subsidy-slabs" className="text-sm text-amber-600 hover:text-amber-700">
          Subsidy slabs &rarr;
        </Link>
      </div>

      {stageTemplates.map((template) => (
        <div key={template.id} className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-medium text-slate-900">
            Stage template — {template.name} {template.discom && `(${template.discom})`}
          </h2>
          <div className="space-y-2">
            {template.steps.map((step) => {
              const updateForThisStep = updateStageTemplateStep.bind(null, step.id);
              return (
                <form key={step.id} action={updateForThisStep} className="grid grid-cols-[3rem_1fr_6rem_8rem_5rem] gap-2 items-center text-sm">
                  <input type="number" name="order" defaultValue={step.order} className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <input name="stepName" defaultValue={step.stepName} className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <input type="number" name="defaultSlaDays" defaultValue={step.defaultSlaDays ?? ""} placeholder="SLA days" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" name="requiresAllocation" defaultChecked={step.requiresAllocation} className="rounded border-slate-300" />
                    Requires allocation
                  </label>
                  <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 text-xs">
                    Save
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ))}

      {approvalTemplates.map((template) => (
        <div key={template.id} className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-medium text-slate-900">
            Approval template — {template.name} ({template.discom})
          </h2>
          <div className="space-y-2">
            {template.steps.map((step) => {
              const updateForThisStep = updateApprovalTemplateStep.bind(null, step.id);
              return (
                <form key={step.id} action={updateForThisStep} className="grid grid-cols-[3rem_1fr_6rem_1fr_5rem] gap-2 items-center text-sm">
                  <input type="number" name="order" defaultValue={step.order} className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <input name="stepName" defaultValue={step.stepName} className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <input type="number" name="slaDays" defaultValue={step.slaDays} placeholder="SLA days" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                  <input
                    name="requiredDocumentTypes"
                    defaultValue={step.requiredDocumentTypes.join(", ")}
                    placeholder="Required documents, comma separated"
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 text-xs">
                    Save
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
