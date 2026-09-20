import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerForUser } from "@/lib/customer";
import { StatusBadge } from "@/components/StatusBadge";

export default async function PortalDocumentsPage() {
  const session = await auth();
  const customer = await getCustomerForUser(session!.user.id);

  const projects = await prisma.project.findMany({
    where: { customerId: customer!.id },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Checklist status for your project paperwork.</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-900">{project.title}</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="px-5 py-2 font-medium">Document</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {project.documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">{doc.type}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{doc.remarks ?? "—"}</td>
                </tr>
              ))}
              {project.documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-center text-slate-400">
                    No documents tracked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
