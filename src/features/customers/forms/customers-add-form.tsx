"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideLoader } from "lucide-react";

import { AddCustomerSchema } from "../schemas";
import { useCreateCustomer } from "../api/use-create-customer";
import { PhoneInput } from "@/components/ui/phone-input";

function CustomersAddForm() {
  const { mutate, isPending } = useCreateCustomer();

  const form = useForm<z.infer<typeof AddCustomerSchema>>({
    resolver: zodResolver(AddCustomerSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "+33",
      adress: "",
      postalCode: "",
      city: "",
      country: "France",
      height: "",
      weight: "",
    },
  });
  function onSubmit(values: z.infer<typeof AddCustomerSchema>) {
    mutate(values, {
      onSuccess: (data) => {
        form.reset();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <div className="flex items-center gap-4 w-full">
          <FormField
            control={form.control}
            name="firstname"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    className="w-full"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@domaine.fr"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>N° de Téléphone</FormLabel>
                <FormControl>
                  <PhoneInput
                    disabled={isPending}
                    className="w-full"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    defaultCountry="FR"
                    international
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="adress"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input
                    placeholder="XX Rue de l'Exemple"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Code Postal</FormLabel>
                <FormControl>
                  <Input
                    placeholder="XXXXX"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Ville</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ville"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Pays</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Pays"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-4 pb-8">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Taille (cm)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="180"
                    type="number"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Poids (kg)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="80"
                    type="number"
                    disabled={isPending}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          size={"lg"}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <LucideLoader className="size-4 mr-2 animate-spin" />
              <span>Chargement...</span>
            </>
          ) : (
            "Ajouter ce client"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default CustomersAddForm;
