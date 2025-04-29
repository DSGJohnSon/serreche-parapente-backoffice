"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CompaniesAddForm from "../forms/companies-add-form";

function CompaniesAdd() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Add a Company</Button>
      </SheetTrigger>
      <SheetContent className="min-w-[30svw]">
        <SheetHeader>
          <SheetTitle>Add a Company</SheetTitle>
        </SheetHeader>
        <Separator className="my-8" />
        <CompaniesAddForm />
      </SheetContent>
    </Sheet>
  );
}

export default CompaniesAdd;
