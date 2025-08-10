import RiceTable from "@/components/RiceTable";
import ImportDialog from "@/components/ImportDialog";
import ExportMenu from "@/components/ExportMenu";
export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>RICE Prioritization App</h1>
      <p style={{ marginTop: 8 }}>
        Placeholder page. See PRD at <code>tasks/prd-rice-prioritization-app.md</code> and tasks at
        <code>tasks/tasks-prd-rice-prioritization-app.md</code>.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        {/* These will be wired to RiceTable state once persistence is added */}
        <ImportDialog onApply={() => {}} />
        <ExportMenu features={[]} />
      </div>
      <RiceTable />
    </main>
  );
}


