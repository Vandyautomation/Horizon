import {
  Sidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { UserSetting } from "@/components/user-setting"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"

interface PageHeaderProps extends React.ComponentProps<typeof Sidebar> {
  onMenuClick: (component: string) => void;
  currentPage : string
}




export default function PageHeader({  onMenuClick}: PageHeaderProps) {
  const pathname = usePathname()
  const currentPage = pathname?.split("/")[1]
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {currentPage === "" && (
          <BreadcrumbItem>
            <BreadcrumbPage onClick={() => onMenuClick("")}>Home</BreadcrumbPage>
          </BreadcrumbItem>)}

          {/* Conditionally show Users breadcrumb if currentPage is Users or Roles */}
          {currentPage === "scale" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("scale")}>eScale</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          {currentPage === "countboard" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("countboard")}>eCountboard</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          {currentPage === "ems" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("countboard")}>Realtime Energy Monitoring</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          
          {currentPage === "users" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("users")}>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          {/* Conditionally show Roles breadcrumb if currentPage is Roles */}
          {currentPage === "roles" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
            <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onMenuClick("users")}>Users</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("roles")}>Roles</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {currentPage === "locations" && (
            <>
            <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onMenuClick("")}>Home</BreadcrumbLink>
          </BreadcrumbItem>
            <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onMenuClick("users")}>Users</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage onClick={() => onMenuClick("locations")}>Locations</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto px-3 space-x-3">
        <ModeToggle />
        <UserSetting />
      </div>
    </header>
  );
}
