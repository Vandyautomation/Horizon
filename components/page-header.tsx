import {
  Sidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { UserSetting } from "@/components/user-setting"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"
import Link from 'next/link';

interface PageHeaderProps extends React.ComponentProps<typeof Sidebar> {
  onMenuClick: (component: string) => void;
  currentPage: string;
}

export default function PageHeader({ onMenuClick }: PageHeaderProps) {
  const pathname = usePathname();
  const currentPage = pathname?.split('/')[1];
  const currentSubPage = pathname?.split('/')[2];

  // Helper function to create proper links
  const createBreadcrumbLink = (
    path: string,
    label: string,
    isPage = false
  ) => {
    const Component = isPage ? BreadcrumbPage : BreadcrumbLink;
    return (
      <Component asChild>
        <Link
          href={`/${path}`}
          onClick={(e) => {
            // Prevent navigation for left click only, allowing right click to show context menu
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              onMenuClick(path);
            }
          }}
        >
          {label}
        </Link>
      </Component>
    );
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {currentPage === '' && (
            <BreadcrumbItem>
              {createBreadcrumbLink('', 'Home', true)}
            </BreadcrumbItem>
          )}

          {/* Conditionally show Users breadcrumb if currentPage is Users or Roles */}
          {currentPage === 'scale' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('scale', 'eScale', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'andon' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('andon', 'Andon', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'master-data' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('master-data', 'Master Data', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'ems' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('ems', 'EMS', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'countboard' && currentSubPage != 'uv' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard', 'Countboard', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentSubPage === 'uv' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard', 'Countboard')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv', 'UV', true)}
              </BreadcrumbItem>
            </>
          )}

          {/* Continue with the same pattern for all other conditions */}
          {/* I've shown the pattern - you would replace all the other breadcrumb items in the same way */}

          {/* Example for a nested route */}
          {currentSubPage === 'coois' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('master-data', 'Master Data')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('master-data/coois', 'COOIS', true)}
              </BreadcrumbItem>
            </>
          )}


          {currentPage === 'machines' && !currentSubPage && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('machines', 'Machines', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('machines/equipments', 'Equipments')}
              </BreadcrumbItem>
            </>
          )}


          {currentSubPage === 'equipments' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('machines', 'Machines')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('machines/equipments', 'Equipments', true)}
              </BreadcrumbItem>
            </>
          )}

          {/* Continue adapting the remaining breadcrumb sections */}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto px-3 space-x-3">
        <ModeToggle />
        <UserSetting />
      </div>
    </header>
  );
}
