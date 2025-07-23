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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideFrown, LucideLoader } from "lucide-react";

import { ChangeUserRoleSchema } from "../schemas";
import { useGetAllUsers } from "../api/use-get-users";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserRole } from "../api/use-update-user-role";

type usersOptionsProps = {
  value: string;
  label: string;
  avatar?: string; // Optional avatar URL
};

function MonitorAddForm() {
  const { mutate, isPending } = useUpdateUserRole();

  const { data: users, isLoading: isLoadingUsers } = useGetAllUsers();
  const [usersOptions, setUsersOptions] = useState<usersOptionsProps[]>([]);

  useEffect(() => {
    let temp: usersOptionsProps[] = [];
    if (users && users.data) {
      temp = users.data
        .filter((user) => user.role === "CUSTOMER")
        .map((user) => ({
          value: user.id,
          label: `${user.name} - (${user.email})`,
        }));
    }
    setUsersOptions(temp);
  }, [users]);

  const form = useForm<z.infer<typeof ChangeUserRoleSchema>>({
    resolver: zodResolver(ChangeUserRoleSchema),
    defaultValues: {
      userId: "",
      role: "MONITEUR",
    },
  });
  function onSubmit(values: z.infer<typeof ChangeUserRoleSchema>) {
    mutate(values, {
      onSuccess: (data) => {
        form.reset();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compte Utilisateur</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un compte client" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem disabled value="loading">
                        <div className="flex items-center">
                          <LucideLoader className="size-4 mr-2 animate-spin" />
                          Chargement des utilisateurs...
                        </div>
                      </SelectItem>
                    ) : usersOptions.length === 0 ? (
                      <SelectItem disabled value="empty">
                        <div className="flex items-center">
                          <LucideFrown className="size-4 mr-2" />
                          Aucun utilisateur trouvé
                        </div>
                      </SelectItem>
                    ) : (
                      <SelectGroup>
                        {usersOptions.map((user) => (
                          <SelectItem key={user.value} value={user.value}>
                            {user.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <FormControl>
                <Select disabled value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONITEUR" disabled>
                      Moniteur
                    </SelectItem>
                    <SelectItem value="CUSTOMER" disabled>
                      Client
                    </SelectItem>
                    <SelectItem value="ADMIN" disabled>
                      Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
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
            "Transformer en Moniteur"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default MonitorAddForm;
