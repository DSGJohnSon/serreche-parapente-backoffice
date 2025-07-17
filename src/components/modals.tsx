"use client";

import CreateCustomerModal from "@/features/customers/modals/create-customer-modal";
import AddMonitorModal from "@/features/users/modals/add-monitor-modal";
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
      <CreateCustomerModal />
      <AddMonitorModal />
    </>
  );
}

export default Modals;
