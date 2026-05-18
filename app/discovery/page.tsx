"use client";
import { useState } from "react";
import FilterSidebar from "@/components/discovery/FilterSidebar";
import TenderTable from "@/components/discovery/TenderTable";
import { DEFAULT_FILTERS, TenderFilters } from "@/lib/api";

export default function Discovery() {
  const [filters, setFilters] = useState<TenderFilters>(DEFAULT_FILTERS);

  function updateFilters(patch: Partial<TenderFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function setPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  return (
    <div className="flex h-full overflow-hidden">
      <FilterSidebar filters={filters} onFilterChange={updateFilters} />
      <TenderTable filters={filters} onFilterChange={updateFilters} onPageChange={setPage} />
    </div>
  );
}
