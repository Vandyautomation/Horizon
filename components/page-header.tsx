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
  const currentSubSubPage = pathname?.split('/')[3];

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
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {currentPage === '' && (
            <BreadcrumbItem>
              {createBreadcrumbLink('', 'Home', true)}
            </BreadcrumbItem>
          )}

          {currentPage === 'login' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('login', 'Login', true)}
              </BreadcrumbItem>
            </>
          )}
          
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

          {currentPage === 'andon' && !currentSubPage && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('andon', 'Andon', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('andon/uv', 'Andon UV', false)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'andon' && currentSubPage === 'uv' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('andon', 'Andon', false)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('andon/uv', 'Andon UV', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'master-data' && !currentSubPage && (
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
                {createBreadcrumbLink('countboard', 'Countboard Injection', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv', 'Countboard UV')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv/management', 'UV Management View')}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'countboard' && currentSubPage === 'uv' && !currentSubSubPage && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard', 'Countboard Injection')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv', 'Countboard UV', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv/management', 'UV Management View')}
              </BreadcrumbItem>
            </>
          )}

          {currentSubPage === 'uv' && currentSubSubPage === 'management' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard', 'Countboard Injection')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv', 'Countboard UV')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('countboard/uv/management', 'UV Management View', true)}
              </BreadcrumbItem>
            </>
          )}

          {/* Continue with the same pattern for all other conditions */}
          {/* I've shown the pattern - you would replace all the other breadcrumb items in the same way */}

          {/* Example for a nested route */}
          {currentSubPage === 'coois'  && (
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

          {currentSubPage === 'routing'  && (
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
                {createBreadcrumbLink('master-data/routing', 'Routing', true)}
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


          {currentPage === 'qco' && !currentSubPage && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('qco', 'SMED', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('qco/config', 'Configuration')}
              </BreadcrumbItem>
            </>
          )}
          {currentPage === 'qco' && currentSubPage == 'config' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('qco', 'SMED')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('qco/config', 'Configuration', true)}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'users' && !currentSubPage && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('users', 'Users', true)}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('users/roles', 'Roles')}
              </BreadcrumbItem>
            </>
          )}

          {currentPage === 'users' && currentSubPage === 'roles' && (
            <>
              <BreadcrumbItem>
                {createBreadcrumbLink('', 'Home')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('users', 'Users')}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {createBreadcrumbLink('users/roles', 'Roles', true)}
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
