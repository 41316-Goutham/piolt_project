import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: { company: true },
    orderBy: { name: "asc" },
  });

  const totalValue = items.reduce((sum, i) => sum + i.unitPrice * i.quantityInStock, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Stock across all OEM brands. Total stock value: {formatCurrency(totalValue)}
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Item</th>
              <th className="px-5 py-2 font-medium">SKU</th>
              <th className="px-5 py-2 font-medium">Category</th>
              <th className="px-5 py-2 font-medium">Brand</th>
              <th className="px-5 py-2 font-medium">Stock</th>
              <th className="px-5 py-2 font-medium">Unit price</th>
              <th className="px-5 py-2 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const lowStock = item.quantityInStock <= item.reorderLevel;
              return (
                <tr key={item.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">{item.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                  <td className="px-5 py-3 text-slate-600">{item.category.replaceAll("_", " ")}</td>
                  <td className="px-5 py-3 text-slate-600">{item.company.name}</td>
                  <td className="px-5 py-3">
                    <span className={lowStock ? "text-red-600 font-medium" : "text-slate-700"}>
                      {item.quantityInStock} {item.unit}
                    </span>
                    {lowStock && (
                      <span className="ml-2 text-xs text-red-500">low stock</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatCurrency(item.unitPrice * item.quantityInStock)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
