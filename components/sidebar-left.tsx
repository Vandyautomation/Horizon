import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,  SidebarHeader, SidebarMenu,  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {   Bot, Calculator,  Camera,  ChevronDown, ChevronRight,  Clock,  CommandIcon, Container, Cpu, Database, HomeIcon,  Lightbulb,  LogOut,  LucideIcon,  MessageSquareWarningIcon,    ScaleIcon,    SprayCan,  Ticket,  User, Zap, Wrench } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
import { DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import React, { use, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';

// This is sample data.
// const sidebarRightData = {
//     user: {
//       name: "shadcn",
//       email: "m@example.com",
//       avatar: "/avatars/shadcn.jpg",
//     },
//     calendars: [
//       {
//         name: "My Calendars",
//         items: ["Personal", "Work", "Family"],
//       },
//       {
//         name: "Favorites",
//         items: ["Holidays", "Birthdays"],
//       },
//       {
//         name: "Other",
//         items: ["Travel", "Reminders", "Deadlines"],
//       },
//     ],
//   }

interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
  onMenuClick: (component: string) => void;
}

export default function SidebarLeft({
  onMenuClick,
  ...props
}: SidebarLeftProps) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('user') || '';
    }
    return '';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(localStorage.getItem('user') || '');
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const sidebarLeftData = {
    teams: [
      {
        name: 'Albea - TPA',
        logo: CommandIcon,
        plan: 'Enterprise',
      },
      // {
      //   name: "Albea - ARPS",
      //   logo: AudioWaveformIcon,
      //   plan: "Enterprise",
      // },
      // {
      //   name: "Albea - BETTS",
      //   logo: CommandIcon,
      //   plan: "Enterprise",
      // },
    ],
    navMain: [
      {
        title: 'Home',
        url: '',
        icon: HomeIcon,
        hidden: false,
      },
      {
        title: 'eCountboard',
        url: 'countboard',
        icon: Calculator,
        hidden: false,
      },
      {
        title: 'eCountboard UV',
        url: 'countboard/uv',
        icon: SprayCan,
        hidden: false,
        items: [
          {
            title: 'Management',
            url: 'countboard/uv/management',
          },
        ],
      },
      {
        title: 'EMS',
        url: 'ems',
        icon: Zap,
        hidden: false,
      },
      {
        title: 'ems_setting',
        url: 'ems_setting',
        icon: Wrench,
        hidden: false,
        items: [
          {
            title: 'Device Management',
            url: 'ems_setting/device-management',
          },
          {
            title: 'Firmware OTA',
            url: 'ems_setting/firmware-ota',
          },
          {
            title: 'Network Health',
            url: 'ems_setting/network-health',
          },
        ],
      },
      {
        title: 'Andon',
        url: 'andon',
        icon: Lightbulb,
        hidden: false,
      },
      {
        title: 'Zhafir ZE 3600',
        url: 'zhafir-ze-3600',
        icon: Cpu,
        hidden: false,
      },
      {
        title: 'SMED',
        url: 'qco',
        icon: Clock,
        hidden: !user,
        items: [
          {
            title: 'Configuration',
            url: 'qco/config',
          },
        ],
      },
      {
        title: 'Horizon',
        url: 'hrz',
        icon: Container,
        hidden: false,
      },
      // {
      //   title: 'eScale',
      //   url: '/',
      //   icon: ScaleIcon,
      //   hidden: !user,
      // },
      {
        title: 'Master Data',
        url: 'master-data',
        icon: Database,
        hidden: !user,
        isActive: false,
        items: [
          {
            title: 'COOIS',
            url: 'master-data/coois',
          },
          {
            title: 'Routing',
            url: 'master-data/routing',
          },
        ],
      },
      {
        title: 'Users',
        url: 'users',
        icon: User,
        hidden: !user,
        isActive: false,
        items: [
          {
            title: 'Role',
            url: 'users/roles',
          },
          // {
          //   title: 'Location',
          //   url: 'users/locations',
          // },
          // {
          //   title: 'UAP',
          //   url: '#',
          // },
        ],
      },
      {
        title: 'Machines',
        url: 'machines',
        icon: Bot,
        hidden: !user,
        items: [
          {
            title: 'Equipments',
            url: 'machines/equipments',
          },
        ],
      },
      {
        title: 'Detection',
        url: 'detection',
        icon: Camera,
        hidden: !user,
      },
      // {
      //   title: 'Tickets',
      //   url: '#',
      //   icon: Ticket,
      //   hidden: !user,
      //   items: [
      //     {
      //       title: 'History',
      //       url: '#',
      //     },
      //     {
      //       title: 'Starred',
      //       url: '#',
      //     },
      //     {
      //       title: 'Settings',
      //       url: '#',
      //     },
      //   ],
      // },
      // {
      //   title: 'Problems',
      //   url: '#',
      //   icon: MessageSquareWarningIcon,
      //   hidden: !user,
      //   items: [
      //     {
      //       title: 'History',
      //       url: '#',
      //     },
      //     {
      //       title: 'Starred',
      //       url: '#',
      //     },
      //     {
      //       title: 'Settings',
      //       url: '#',
      //     },
      //   ],
      // },
    ],
    navSecondary: [
      // {
      //   title: "Settings",
      //   url: "#",
      //   icon: Settings2,
      // },
      {
        title: "Logout",
        url: "login",
        icon: LogOut,
      },
    ],
    favorites: [
      {
        name: 'Project Management & Task Tracking',
        url: '#',
        emoji: '📊',
      },
      {
        name: 'Family Recipe Collection & Meal Planning',
        url: '#',
        emoji: '🍳',
      },
      {
        name: 'Fitness Tracker & Workout Routines',
        url: '#',
        emoji: '💪',
      },
      {
        name: 'Book Notes & Reading List',
        url: '#',
        emoji: '📚',
      },
      {
        name: 'Sustainable Gardening Tips & Plant Care',
        url: '#',
        emoji: '🌱',
      },
      {
        name: 'Language Learning Progress & Resources',
        url: '#',
        emoji: '🗣️',
      },
      {
        name: 'Home Renovation Ideas & Budget Tracker',
        url: '#',
        emoji: '🏠',
      },
      {
        name: 'Personal Finance & Investment Portfolio',
        url: '#',
        emoji: '💰',
      },
      {
        name: 'Movie & TV Show Watchlist with Reviews',
        url: '#',
        emoji: '🎬',
      },
      {
        name: 'Daily Habit Tracker & Goal Setting',
        url: '#',
        emoji: '✅',
      },
    ],
    workspaces: [
      {
        name: 'Personal Life Management',
        emoji: '🏠',
        pages: [
          {
            name: 'Daily Journal & Reflection',
            url: '#',
            emoji: '📔',
          },
          {
            name: 'Health & Wellness Tracker',
            url: '#',
            emoji: '🍏',
          },
          {
            name: 'Personal Growth & Learning Goals',
            url: '#',
            emoji: '🌟',
          },
        ],
      },
      {
        name: 'Professional Development',
        emoji: '💼',
        pages: [
          {
            name: 'Career Objectives & Milestones',
            url: '#',
            emoji: '🎯',
          },
          {
            name: 'Skill Acquisition & Training Log',
            url: '#',
            emoji: '🧠',
          },
          {
            name: 'Networking Contacts & Events',
            url: '#',
            emoji: '🤝',
          },
        ],
      },
      {
        name: 'Creative Projects',
        emoji: '🎨',
        pages: [
          {
            name: 'Writing Ideas & Story Outlines',
            url: '#',
            emoji: '✍️',
          },
          {
            name: 'Art & Design Portfolio',
            url: '#',
            emoji: '🖼️',
          },
          {
            name: 'Music Composition & Practice Log',
            url: '#',
            emoji: '🎵',
          },
        ],
      },
      {
        name: 'Home Management',
        emoji: '🏡',
        pages: [
          {
            name: 'Household Budget & Expense Tracking',
            url: '#',
            emoji: '💰',
          },
          {
            name: 'Home Maintenance Schedule & Tasks',
            url: '#',
            emoji: '🔧',
          },
          {
            name: 'Family Calendar & Event Planning',
            url: '#',
            emoji: '📅',
          },
        ],
      },
      {
        name: 'Travel & Adventure',
        emoji: '🧳',
        pages: [
          {
            name: 'Trip Planning & Itineraries',
            url: '#',
            emoji: '🗺️',
          },
          {
            name: 'Travel Bucket List & Inspiration',
            url: '#',
            emoji: '🌎',
          },
          {
            name: 'Travel Journal & Photo Gallery',
            url: '#',
            emoji: '📸',
          },
        ],
      },
    ],
  };

  const router = useRouter();
  const pathname = usePathname().replace('/', '');

  return (
    <Sidebar className="border-r-0" {...props} collapsible="icon">
      <SidebarHeader>
        
        {/* <TeamSwitcher teams={sidebarLeftData.teams} /> */}
      <Link 
        className="flex flex-nowrap gap-2 items-center pt-1 justify-start rounded-md bg-sidebar-primary text-sidebar-primary-foreground ml-2 sidebar-expanded:flex sidebar-collapsed:hidden" 
        href="/">
        <Image
          src="/admin/android-chrome-192x192.png"
          alt="IoT App"
          width={24}
          height={24}
        /> 
        <span className="truncate font-semibold">IoT App</span>
      </Link>
        <NavMain items={sidebarLeftData.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary
          items={sidebarLeftData.navSecondary}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );

  function NavMain({
    items,
  }: {
    items: {
      title: string;
      url: string;
      icon: LucideIcon;
      isActive?: boolean;
      hidden?: boolean;
      items?: { title: string; url: string }[];
    }[];
  }) {
    return (
      <SidebarMenu>
        {items
          .filter((item) => !item.hidden)
          .map((item) => {
            const isItemActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
            <SidebarMenuItem key={item.title}>
              {item.items?.length ? (
                <Collapsible
                  defaultOpen={
                    item.isActive || pathname.includes(`${item.url}`)
                  }
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <Link href={`/${item.url}`}>
                      <SidebarMenuButton tooltip={item.title} isActive={isItemActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </Link>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          pathname.startsWith(`${subItem.url}/`);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <Link href={`/${subItem.url}`}>
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                  <Link href={`/${item.url}`}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )})}
      </SidebarMenu>
    );
  }

  function NavSecondary({
    items,
    ...props
  }: {
    items: {
      title: string;
      url: string;
      icon: LucideIcon;
      badge?: React.ReactNode;
    }[];
  } & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    return (
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={`/${item.url}`}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  function TeamSwitcher({
    teams,
  }: {
    teams: {
      name: string;
      logo: React.ElementType | string;
      plan: string;
    }[];
  }) {
    const [activeTeam, setActiveTeam] = React.useState(teams[0]);

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-fit px-1.5">
                <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src="/admin/android-chrome-192x192.png"
                    alt="IoT App"
                    width={24}
                    height={24}
                  />
                </div>
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <ChevronDown className="opacity-100" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Image
                      src="/admin/android-chrome-192x192.png"
                      alt={team.name}
                      width={24}
                      height={24}
                    />
                    {/* <team.logo className="size-4 shrink-0" /> */}
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add team</div>
                  </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
}


