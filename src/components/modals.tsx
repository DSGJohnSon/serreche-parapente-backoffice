"use client";

import CreateCompanyModal from "@/features/companies/components/modals/create-company-modal";
import { useEffect, useState } from "react";

function Modals() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <CreateCompanyModal />
    </>
  );
}

export default Modals;
