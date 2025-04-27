import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

function CompaniesListSkeleton() {
  return (
    <div className="grid grid-cols-6 gap-4">
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
    </div>
  );
}

export default CompaniesListSkeleton;
