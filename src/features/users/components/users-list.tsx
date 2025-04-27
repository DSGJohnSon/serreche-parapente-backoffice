"use client";

import React from "react";
import { useGetAllUsers } from "../api/use-get-users";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideBan } from "lucide-react";
import UsersListSkeleton from "./skeletons/users-list-skeleton";

function UsersList() {
  const { data: users, isLoading } = useGetAllUsers();

  return (
    <div>
      {isLoading ? (
        <UsersListSkeleton />
      ) : (
        <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {users?.data.map((user) => (
            <li
              key={user.id}
              className="py-2 px-4 rounded-md hover:bg-foreground/5 border border-input space-y-2">
              <div className="space-y-2">
                <Avatar>
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-nowrap font-bold text-sm inline-flex items-center">
                    {user.name}{" "}
                    {user.role.includes("ADMIN") ? (
                      <>
                        <span className="text-xs font-normal bg-foreground/10 text-foreground px-2 ml-1 rounded-full">
                          Administrateur
                        </span>
                      </>
                    ) : (
                      ""
                    )}
                  </p>
                  <span className="inline-block text-sm">{user.email}</span>
                </div>
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={"outline"}>
                        <LucideBan size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Block User</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UsersList;
