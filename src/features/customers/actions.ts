"use server";

import { revalidatePath } from "next/cache";
import { AddCustomerSchema } from "./schemas";

export async function createCustomer(data: {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  adress: string;
  postalCode: string;
  city: string;
  country: string;
  height: number;
  weight: number;
}) {
  const apiKey = process.env.PUBLIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("PUBLIC_API_KEY is not configured");
  }

  // Validate data with schema
  const validatedData = AddCustomerSchema.parse(data);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/customers/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Revalidate customers data
    revalidatePath("/dashboard/customers");
    
    return result;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}