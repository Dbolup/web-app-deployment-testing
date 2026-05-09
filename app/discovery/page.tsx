import React from "react";
import Filters from "@/components/discovery/FilterSidebar";
import TenderTable from "../../components/discovery/TenderTable";

export default function Discovery() {
  return (
    <div className="flex">
      <Filters />
      <TenderTable />
    </div>
  );
}
