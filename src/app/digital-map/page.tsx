"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

type PlotStatus = "available" | "hold" | "booked" | "sold";

interface Plot {
  id: string;
  block: string;
  plotNo: string;
  status: PlotStatus;
  size: number;
  sizeUnit: string;
  price: number;
  projectId: string;
  projectName: string;
}

interface Project { id: string; name: string; }

export default function DigitalMapPage() {
  const router = useRouter();
  const { toast, ToastContainer } = useToast();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchPlot, setSearchPlot] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        fetch("/api/units?all=1"),
        fetch("/api/projects"),
      ]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      const mapped: Plot[] = (uData.units || []).map((u: any) => ({
        id: u.id,
        block: u.block.name,
        plotNo: u.plotNo,
        status: u.status as PlotStatus,
        size: u.size,
        sizeUnit: u.sizeUnit,
        price: Number(u.price),
        projectId: u.block.project.id,
        projectName: u.block.project.name,
      }));
      setPlots(mapped);
      setProjects(pData.projects || []);
    } catch { toast("Failed to load map data", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueBlocks = [...new Set(
    plots.filter(p => selectedProject === "All" || p.projectId === selectedProject).map(p => p.block)
  )].sort();

  const filteredPlots = plots.filter((p) => {
    if (selectedProject !== "All" && p.projectId !== selectedProject) return false;
    if (selectedBlock !== "All" && p.block !== selectedBlock) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (searchPlot && !p.plotNo.toLowerCase().includes(searchPlot.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: filteredPlots.length,
    available: filteredPlots.filter((p) => p.status === "available").length,
    hold: filteredPlots.filter((p) => p.status === "hold").length,
    booked: filteredPlots.filter((p) => p.status === "booked").length,
    sold: filteredPlots.filter((p) => p.status === "sold").length,
  };

  async function updatePlotStatus(plotId: string, newStatus: PlotStatus) {
    try {
      const res = await fetch("/api/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: plotId, status: newStatus, changedBy: "digital-map" }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Failed to update", "error"); return; }
      setPlots((prev) => prev.map((p) => p.id === plotId ? { ...p, status: newStatus } : p));
      setSelectedPlot((prev) => prev && prev.id === plotId ? { ...prev, status: newStatus } : prev);
      toast(`${data.message}`, "success");
    } catch { toast("Network error", "error"); }
  }

  function handleProjectChange(projectId: string) {
    setSelectedProject(projectId);
    setSelectedBlock("All");
    setSelectedPlot(null);
  }

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Digital Map - Plot Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => toast("Map exported as PDF", "success")} className="px-4 py-2 border rounded-md text-sm font-medium">Export</button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Print Map</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-200 border border-green-400"></div>
          <span className="text-sm">Available ({stats.available})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400"></div>
          <span className="text-sm">Hold ({stats.hold})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-200 border border-orange-400"></div>
          <span className="text-sm">Booked ({stats.booked})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-200 border border-red-400"></div>
          <span className="text-sm">Sold ({stats.sold})</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedProject}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="All">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="All">All Blocks</option>
          {uniqueBlocks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="hold">Hold</option>
          <option value="booked">Booked</option>
          <option value="sold">Sold</option>
        </select>
        <input
          type="text"
          placeholder="Search plot number..."
          value={searchPlot}
          onChange={(e) => setSearchPlot(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-64"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="text-muted-foreground text-sm">Loading map...</div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Grid */}
          <div className="lg:col-span-3">
            {filteredPlots.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No plots found for the selected filters</div>
            ) : (
              <div className="digital-map-grid">
                {filteredPlots.map((plot) => (
                  <div
                    key={plot.id}
                    className={`plot-cell plot-${plot.status} ${selectedPlot?.id === plot.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedPlot(plot)}
                  >
                    <span className="text-[10px] opacity-70">{plot.block}</span>
                    <span className="text-lg font-bold">{plot.plotNo}</span>
                    <span className="text-[10px] opacity-70">{plot.size} {plot.sizeUnit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plot Details Sidebar */}
          <div>
            <div className="chart-container sticky top-20">
              {selectedPlot ? (
                <>
                  <h3 className="font-semibold mb-4">Plot Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Project</label>
                      <p className="font-medium">{selectedPlot.projectName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Plot</label>
                      <p className="font-medium">{selectedPlot.block} - {selectedPlot.plotNo}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <p>
                        <span className={`status-badge ${
                          selectedPlot.status === 'available' ? 'bg-green-100 text-green-800' :
                          selectedPlot.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                          selectedPlot.status === 'booked' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedPlot.status.charAt(0).toUpperCase() + selectedPlot.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Size</label>
                      <p className="font-medium">{selectedPlot.size} {selectedPlot.sizeUnit}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Price</label>
                      <p className="font-medium">PKR {selectedPlot.price.toLocaleString()}</p>
                    </div>
                    <div className="pt-3 border-t space-y-2">
                      {selectedPlot.status === 'available' && (
                        <>
                          <button onClick={() => updatePlotStatus(selectedPlot.id, "hold")} className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium">
                            Mark Hold
                          </button>
                          <button onClick={() => router.push(`/bookings?projectId=${selectedPlot.projectId}&unitId=${selectedPlot.id}`)} className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
                            Book Plot
                          </button>
                        </>
                      )}
                      {selectedPlot.status === 'hold' && (
                        <>
                          <button onClick={() => updatePlotStatus(selectedPlot.id, "booked")} className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
                            Confirm Booking
                          </button>
                          <button onClick={() => updatePlotStatus(selectedPlot.id, "available")} className="w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium">
                            Release Hold
                          </button>
                        </>
                      )}
                      {selectedPlot.status === 'booked' && (
                        <button onClick={() => router.push("/bookings")} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                          View Booking
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Select a plot to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </AppShell>
  );
}
