"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import type { StudioNavigation } from "@/lib/use-studio-navigation";

interface StudioBreadcrumbProps {
  navigation: StudioNavigation;
}

export function StudioBreadcrumb({ navigation }: StudioBreadcrumbProps) {
  const { connectionName, database, table } = navigation;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {connectionName ? (
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigation.navigateToConnections();
              }}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Home className="w-4 h-4" />
              <span>Connections</span>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>Connections</span>
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {connectionName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {database ? (
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigation.navigateToConnection();
                  }}
                  className="hover:text-foreground"
                >
                  {connectionName}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{connectionName}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {database && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {table ? (
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigation.navigateToDatabase();
                  }}
                  className="hover:text-foreground"
                >
                  {database}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{database}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {table && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{table}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
