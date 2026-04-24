"use client";

import Link from "next/link";
import { LogOut, Mail, Shield, Settings as SettingsIcon } from "lucide-react";
import { signOut } from "@/app/(app)/_actions/sign-out";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserMenu({
  email,
  fullName,
  isAdmin,
}: {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
}) {
  const initials =
    (fullName ?? email ?? "?")
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline text-sm max-w-40 truncate">
          {fullName || email || "Account"}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold truncate">
                {fullName || "Unnamed user"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <Mail className="size-3 shrink-0" />
                {email ?? "no email"}
              </div>
              {isAdmin && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[0.7rem] text-primary font-medium">
                  <Shield className="size-3" />
                  Administrator
                </div>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield className="size-4" />
            Admin panel
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem
            nativeButton
            render={
              <button type="submit" className="w-full text-left cursor-pointer" />
            }
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
