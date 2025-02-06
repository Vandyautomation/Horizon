import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,  SidebarHeader, SidebarMenu,  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AudioWaveformIcon,  Bot, Calculator,  ChevronDown, ChevronRight,  CommandIcon, HomeIcon, LogOut, LucideIcon,  MessageSquareWarningIcon,  Plus,  ScaleIcon,  Settings2,  Ticket,  User } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
import { DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import React from "react";
const sidebarLeftData = {
    teams: [
      {
        name: "Albea - TPA",
        logo: CommandIcon,
        plan: "Enterprise",
      },
      {
        name: "Albea - ARPS",
        logo: AudioWaveformIcon,
        plan: "Enterprise",
      },
      {
        name: "Albea - BETTS",
        logo: CommandIcon,
        plan: "Enterprise",
      },
    ],
    navMain: [
      {
        title: "Home",
        url: "",
        icon: HomeIcon,
      },
      {
        title: "eScale",
        url: "scale",
        icon: ScaleIcon,
      },
      {
        title: "eCountboard",
        url: "countboard",
        icon: Calculator,
      },
      {
        title: "Users",
        url: "users",
        icon: User,
        isActive: false,
        items: [
            {
              title: "Role",
              url: "roles",
            },
            {
              title: "Location",
              url: "locations",
            },
            {
              title: "UAP",
              url: "#",
            },
          ],
      },
      {
        title: "Machines",
        url: "#",
        icon: Bot,
        items: [
            {
              title: "Transaction",
              url: "#",
            },
            {
              title: "Status",
              url: "#",
            },
            {
              title: "Settings",
              url: "#",
            },
          ],
      },
      {
        title: "Tickets",
        url: "#",
        icon: Ticket,
        items: [
            {
              title: "History",
              url: "#",
            },
            {
              title: "Starred",
              url: "#",
            },
            {
              title: "Settings",
              url: "#",
            },
          ],
      },
      {
        title: "Problems",
        url: "#",
        icon: MessageSquareWarningIcon,
        items: [
            {
              title: "History",
              url: "#",
            },
            {
              title: "Starred",
              url: "#",
            },
            {
              title: "Settings",
              url: "#",
            },
          ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
      },
      {
        title: "Logout",
        url: "login",
        icon: LogOut,
      },
    ],
    favorites: [
      {
        name: "Project Management & Task Tracking",
        url: "#",
        emoji: "📊",
      },
      {
        name: "Family Recipe Collection & Meal Planning",
        url: "#",
        emoji: "🍳",
      },
      {
        name: "Fitness Tracker & Workout Routines",
        url: "#",
        emoji: "💪",
      },
      {
        name: "Book Notes & Reading List",
        url: "#",
        emoji: "📚",
      },
      {
        name: "Sustainable Gardening Tips & Plant Care",
        url: "#",
        emoji: "🌱",
      },
      {
        name: "Language Learning Progress & Resources",
        url: "#",
        emoji: "🗣️",
      },
      {
        name: "Home Renovation Ideas & Budget Tracker",
        url: "#",
        emoji: "🏠",
      },
      {
        name: "Personal Finance & Investment Portfolio",
        url: "#",
        emoji: "💰",
      },
      {
        name: "Movie & TV Show Watchlist with Reviews",
        url: "#",
        emoji: "🎬",
      },
      {
        name: "Daily Habit Tracker & Goal Setting",
        url: "#",
        emoji: "✅",
      },
    ],
    workspaces: [
      {
        name: "Personal Life Management",
        emoji: "🏠",
        pages: [
          {
            name: "Daily Journal & Reflection",
            url: "#",
            emoji: "📔",
          },
          {
            name: "Health & Wellness Tracker",
            url: "#",
            emoji: "🍏",
          },
          {
            name: "Personal Growth & Learning Goals",
            url: "#",
            emoji: "🌟",
          },
        ],
      },
      {
        name: "Professional Development",
        emoji: "💼",
        pages: [
          {
            name: "Career Objectives & Milestones",
            url: "#",
            emoji: "🎯",
          },
          {
            name: "Skill Acquisition & Training Log",
            url: "#",
            emoji: "🧠",
          },
          {
            name: "Networking Contacts & Events",
            url: "#",
            emoji: "🤝",
          },
        ],
      },
      {
        name: "Creative Projects",
        emoji: "🎨",
        pages: [
          {
            name: "Writing Ideas & Story Outlines",
            url: "#",
            emoji: "✍️",
          },
          {
            name: "Art & Design Portfolio",
            url: "#",
            emoji: "🖼️",
          },
          {
            name: "Music Composition & Practice Log",
            url: "#",
            emoji: "🎵",
          },
        ],
      },
      {
        name: "Home Management",
        emoji: "🏡",
        pages: [
          {
            name: "Household Budget & Expense Tracking",
            url: "#",
            emoji: "💰",
          },
          {
            name: "Home Maintenance Schedule & Tasks",
            url: "#",
            emoji: "🔧",
          },
          {
            name: "Family Calendar & Event Planning",
            url: "#",
            emoji: "📅",
          },
        ],
      },
      {
        name: "Travel & Adventure",
        emoji: "🧳",
        pages: [
          {
            name: "Trip Planning & Itineraries",
            url: "#",
            emoji: "🗺️",
          },
          {
            name: "Travel Bucket List & Inspiration",
            url: "#",
            emoji: "🌎",
          },
          {
            name: "Travel Journal & Photo Gallery",
            url: "#",
            emoji: "📸",
          },
        ],
      },
    ],
  }

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

export default function SidebarLeft({ onMenuClick, ...props }:SidebarLeftProps) {
    return (
      <Sidebar className="border-r-0" {...props} collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher teams={sidebarLeftData.teams} />
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
    )
    function NavMain({
        items,
      }: {
        items: {
          title: string
          url: string
          icon: LucideIcon
          isActive?: boolean,
          items?: { title: string, url: string }[] 
        }[]
      }) {
        return (
            <SidebarMenu>
            {items.map((item) => (
            <SidebarMenuItem key={item.title}>
            {item.items?.length  ? (
                <Collapsible
                defaultOpen={item.isActive}
                className="group/collapsible"
                >
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton onClick={() => onMenuClick(item.url)} tooltip={item.title}>
                        {item.icon  && <item.icon />}
                        <span onClick={() => onMenuClick(item.url)}>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                        {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                                <button  onClick={() => onMenuClick(subItem.url)}>{subItem.title}</button>
                            </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            ) : (
                <SidebarMenuButton onClick={() => onMenuClick(item.url)} tooltip={item.title}>
                {item.icon && <item.icon />}
                <span  onClick={() => onMenuClick(item.url)} >{item.title}</span>
                </SidebarMenuButton>
            )}
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
        )
      }


      function NavSecondary({
        items,
        ...props
      }: {
        items: {
          title: string
          url: string
          icon: LucideIcon
          badge?: React.ReactNode
        }[]
      } & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
        return (
          <SidebarGroup {...props}>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      }


      function TeamSwitcher({
        teams,
      }: {
        teams: {
          name: string
          logo: React.ElementType
          plan: string
        }[]
      }) 
      
      {
        const [activeTeam, setActiveTeam] = React.useState(teams[0])
      
        return (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-fit px-1.5">
                    <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                      <activeTeam.logo className="size-3" />
                    </div>
                    <span className="truncate font-semibold">{activeTeam.name}</span>
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
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      {team.name}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add team</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )
      }
      
      
  }