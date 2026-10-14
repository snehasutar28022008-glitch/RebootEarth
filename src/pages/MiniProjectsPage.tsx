import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Project, ProjectComponent, Component } from '@/lib/supabase';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { Lightbulb, ChevronDown, ChevronUp, Wrench, CheckCircle, XCircle, Package } from 'lucide-react';

interface ProjectWithComponents extends Project {
  project_components: ProjectComponent[];
}

export function MiniProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithComponents[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: projData }, { data: compData }] = await Promise.all([
        supabase.from('projects').select('*, project_components(*)').order('name'),
        supabase.from('components').select('*'),
      ]);
      setProjects((projData ?? []) as ProjectWithComponents[]);
      setComponents((compData ?? []) as Component[]);
      setLoading(false);
    })();
  }, []);

  const componentMap = new Map(components.map((c) => [c.name.toLowerCase(), c]));

  const checkAvailability = (pc: ProjectComponent): { available: boolean; label: string } => {
    const comp = componentMap.get(pc.component_name.toLowerCase());
    if (!comp) {
      return { available: false, label: 'Not in inventory' };
    }
    if (pc.required_quantity === null) {
      // No required quantity: available if quantity > 0
      return { available: comp.quantity > 0, label: 'Quantity not specified' };
    }
    return { available: comp.quantity >= pc.required_quantity, label: `${comp.quantity} in stock` };
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader title="Mini Projects" subtitle="Browse project ideas and check if components are available" icon={Lightbulb} />

      {projects.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No projects yet" message="Projects will appear here once the admin adds them." />
      ) : (
        <div className="space-y-4">
          {projects.map((project, i) => {
            const isExpanded = expandedId === project.id;
            return (
              <div key={project.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-forest-800">{project.name}</h3>
                    {project.is_demo && (
                      <span className="mt-1 inline-block rounded bg-mint/40 px-1.5 py-0.5 text-[10px] font-semibold text-forest-600">Demo data</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-forest-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-forest-400 flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-forest-50 pt-4">
                    {project.description && (
                      <p className="text-sm text-forest-600">{project.description}</p>
                    )}

                    {/* Tools Required */}
                    {project.tools_required && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-light/10 p-3">
                        <Wrench className="h-4 w-4 text-amber-dark flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-dark">Tools Required</p>
                          <p className="text-xs text-forest-700 mt-0.5">{project.tools_required}</p>
                        </div>
                      </div>
                    )}

                    {/* Component list */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-forest-700">Components Needed</p>
                      <div className="space-y-2">
                        {project.project_components.map((pc) => {
                          const avail = checkAvailability(pc);
                          return (
                            <div key={pc.id} className="flex items-center justify-between rounded-lg bg-forest-50/50 px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {avail.available ? (
                                  <CheckCircle className="h-4 w-4 text-forest-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-hazard flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <span className="text-sm text-forest-700 truncate block">{pc.component_name}</span>
                                  {pc.note && <span className="text-[10px] text-amber-dark block">{pc.note}</span>}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {pc.required_quantity !== null ? (
                                  <span className="text-xs font-medium text-forest-600">x{pc.required_quantity}</span>
                                ) : (
                                  <span className="text-xs text-forest-400">Qty not specified</span>
                                )}
                                <p className={`text-[10px] ${avail.available ? 'text-forest-500' : 'text-hazard'}`}>
                                  {avail.available ? 'Available' : 'Not Available'} &middot; {avail.label}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
