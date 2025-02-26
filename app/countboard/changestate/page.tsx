import ChangeState from "@/components/change-state";

const data = [
    {
        "ID": "2074670",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 09:18:41"
    },
    {
        "ID": "2074593",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-26 09:04:45"
    },
    {
        "ID": "2074156",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 07:43:28"
    },
    {
        "ID": "2074154",
        "Color": "YELLOW",
        "AdjustedStatusDate": "2025-02-26 07:43:25"
    },
    {
        "ID": "2074049",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 07:16:53"
    },
    {
        "ID": "2074047",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-26 07:16:45"
    },
    {
        "ID": "2074042",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 07:16:18"
    },
    {
        "ID": "2074033",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-26 07:13:25"
    },
    {
        "ID": "2073994",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-26 07:04:22"
    },
    {
        "ID": "2073982",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-26 06:59:21"
    },
    {
        "ID": "2073871",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 06:35:30"
    },
    {
        "ID": "2073858",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-26 06:31:32"
    },
    {
        "ID": "2073769",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-26 06:11:30"
    },
    {
        "ID": "2073471",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-26 04:22:50"
    },
    {
        "ID": "2073453",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-26 04:18:02"
    },
    {
        "ID": "2072549",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 23:03:46"
    },
    {
        "ID": "2072538",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 23:01:31"
    },
    {
        "ID": "2071961",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 20:26:25"
    },
    {
        "ID": "2071944",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 20:22:00"
    },
    {
        "ID": "2071358",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 17:40:36"
    },
    {
        "ID": "2071354",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 17:39:38"
    },
    {
        "ID": "2071330",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 17:35:51"
    },
    {
        "ID": "2071314",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 17:30:50"
    },
    {
        "ID": "2070832",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 15:55:43"
    },
    {
        "ID": "2070821",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 15:54:53"
    },
    {
        "ID": "2070700",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 15:47:30"
    },
    {
        "ID": "2070608",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 15:42:30"
    },
    {
        "ID": "2070322",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:59:49"
    },
    {
        "ID": "2070321",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 14:59:37"
    },
    {
        "ID": "2070295",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 14:52:06"
    },
    {
        "ID": "2070254",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:42:25"
    },
    {
        "ID": "2070253",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 14:42:13"
    },
    {
        "ID": "2070236",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 14:39:02"
    },
    {
        "ID": "2070186",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:30:14"
    },
    {
        "ID": "2070183",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 14:30:09"
    },
    {
        "ID": "2070177",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:29:14"
    },
    {
        "ID": "2070176",
        "Color": "YELLOW",
        "AdjustedStatusDate": "2025-02-25 14:29:07"
    },
    {
        "ID": "2070175",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:29:04"
    },
    {
        "ID": "2070173",
        "Color": "YELLOW",
        "AdjustedStatusDate": "2025-02-25 14:28:59"
    },
    {
        "ID": "2070170",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 14:28:22"
    },
    {
        "ID": "2070049",
        "Color": "GREEN",
        "AdjustedStatusDate": "2025-02-25 14:12:18"
    },
    {
        "ID": "2070043",
        "Color": "PURPLE",
        "AdjustedStatusDate": "2025-02-25 14:12:03"
    },
    {
        "ID": "2070019",
        "Color": "ORANGE",
        "AdjustedStatusDate": "2025-02-25 14:10:35"
    }
]

export default function Change() {
    return (
        <div className="flex justify-between space-y-2">
              <ChangeState data={data}/>
            </div>
    )
}