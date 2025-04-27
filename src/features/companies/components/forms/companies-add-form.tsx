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
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddCompanySchema } from "../../schemas";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCompany } from "../../api/use-create-company";
import { LucideBuilding, LucideLoader } from "lucide-react";
import { useGetAllUsers } from "@/features/users/api/use-get-users";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Flag from "react-world-flags";
import { countries } from "@/data/countries";
import { Company } from "@prisma/client";

type usersOptionsProps = {
  value: string;
  label: string;
};

function CompaniesAddForm({
  defaultUsersInCompany,
  disableUsersSelect, //Permits to disable the user selection for the "new company" form (used by user and not admin)
  onFormSubmit,
}: {
  defaultUsersInCompany?: string[];
  disableUsersSelect?: boolean;
  onFormSubmit: (data: {
    success: boolean;
    message: string;
    data: Company[];
  }) => void;
}) {
  const { mutate, isPending } = useCreateCompany();
  const { data: users, isLoading: isLoadingUsers } = useGetAllUsers();
  const [usersOptions, setUsersOptions] = useState<usersOptionsProps[]>([]);

  useEffect(() => {
    let temp: usersOptionsProps[] = [];
    if (users) {
      temp = users.data.map((user) => ({
        value: user.id,
        label: `${user.name} - (${user.email})`,
      }));
    }
    setUsersOptions(temp);
  }, [users]);

  const form = useForm<z.infer<typeof AddCompanySchema>>({
    resolver: zodResolver(AddCompanySchema),
    defaultValues: {
      name: "",
      siret: "",
      country: "",
      users: defaultUsersInCompany || [],
    },
  });
  function onSubmit(values: z.infer<typeof AddCompanySchema>) {
    mutate(values, {
      onSuccess: (data) => {
        form.reset();
        onFormSubmit({ ...data, data: [data.data] });
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;entreprise</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nom de l'entreprise"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2 border border-input p-4 rounded-lg">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-foreground/5  rounded-full">
            <LucideBuilding className="size-3" />
            <h2 className="text-xs">Informations légales</h2>
          </div>
          <FormField
            control={form.control}
            name="siret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro d&apos;identification</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: SIRET (xxx xxx xxx xxxxx)"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormDescription>ex: Siret, NR, EIN, etc.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pays d&apos;immatriculation</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectioner un pays" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country, index) => (
                      <SelectItem
                        value={country.value}
                        key={country.value + index}
                        className="hover:bg-gray-100 hover:cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center rounded-full overflow-hidden">
                            <Flag
                              code={country.code}
                              className="w-full h-full object-cover"
                              fallback={
                                <span className="w-full h-full bg-black rounded-full block">
                                  -
                                </span>
                              }
                            />
                          </div>
                          {country.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Pays de résidence fiscale de l&apos;entreprise.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="users"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Membre(s) de l&apos;entreprise -{" "}
                <span className="py-0.5 px-1.5 bg-foreground/10 rounded-full text-xs">
                  {field.value?.length || 0} / 5
                </span>
              </FormLabel>
              {
                !isLoadingUsers &&
                <MultiSelect
                options={usersOptions}
                onValueChange={field.onChange}
                valuesToDisabled={defaultUsersInCompany}
                defaultValue={defaultUsersInCompany || field.value}
                disabled={isLoadingUsers || isPending}
                placeholder="Sélectionner un/des membre(s)"
                variant="default"
                maxCount={5}
                />
              }
              {
                <FormDescription>
                  {disableUsersSelect
                    ? "Vous pourrez ajouter des membres plus tard."
                    : "Vous pouvez ajouter jusqu'à 5 membres."}
                </FormDescription>
              }
              <FormMessage />
            </FormItem>
          )}
        />
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
            "Ajouter cette entreprise"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default CompaniesAddForm;
