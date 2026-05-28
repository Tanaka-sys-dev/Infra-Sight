export type DeviceClass =
  | "switch"
  | "router"
  | "server"
  | "workstation"
  | "printer"
  | "access_point"
  | "media_converter"
  | "ups";

export interface InfrastructureDevice {
  deviceId: string;
  deviceClass: DeviceClass;
  model: string;
  location: string;
  ipAddress: string;
  macAddress: string;
  rackUnit?: number;
  hostname?: string;
}

export const INFRASTRUCTURE_DEVICES: InfrastructureDevice[] = [
  // SWITCHES (>= 7)
  {
    deviceId: "SW-ADMIN-01",
    deviceClass: "switch",
    model: "Cisco Catalyst 2960",
    location: "Admin Block",
    ipAddress: "10.0.0.10",
    macAddress: "00:1A:2B:3C:4D:01",
    rackUnit: 18,
    hostname: "sw-admin-01.gzu.local",
  },
  {
    deviceId: "SW-ADMIN-02",
    deviceClass: "switch",
    model: "Cisco Catalyst 2960",
    location: "Admin Block",
    ipAddress: "10.0.0.11",
    macAddress: "00:1A:2B:3C:4D:02",
    rackUnit: 17,
    hostname: "sw-admin-02.gzu.local",
  },
  {
    deviceId: "SW-BURSARY-01",
    deviceClass: "switch",
    model: "HP ProCurve 1810",
    location: "Bursary Department",
    ipAddress: "10.0.1.10",
    macAddress: "00:1A:2B:3C:4D:03",
    hostname: "sw-bursary-01.gzu.local",
  },
  {
    deviceId: "SW-LAB-A-01",
    deviceClass: "switch",
    model: "D-Link DGS-1016D",
    location: "Computer Lab A",
    ipAddress: "10.0.3.10",
    macAddress: "00:1A:2B:3C:4D:04",
    hostname: "sw-lab-a-01.gzu.local",
  },
  {
    deviceId: "SW-LAB-B-01",
    deviceClass: "switch",
    model: "D-Link DGS-1016D",
    location: "Computer Lab B",
    ipAddress: "10.0.4.10",
    macAddress: "00:1A:2B:3C:4D:05",
    hostname: "sw-lab-b-01.gzu.local",
  },
  {
    deviceId: "SW-LIB-01",
    deviceClass: "switch",
    model: "Cisco Catalyst 3560",
    location: "Library",
    ipAddress: "10.0.5.10",
    macAddress: "00:1A:2B:3C:4D:06",
    hostname: "sw-lib-01.gzu.local",
  },
  {
    deviceId: "SW-CORE-01",
    deviceClass: "switch",
    model: "Cisco Catalyst 4500",
    location: "Network Closet",
    ipAddress: "10.0.6.1",
    macAddress: "00:1A:2B:3C:4D:07",
    rackUnit: 42,
    hostname: "sw-core-01.gzu.local",
  },

  // ROUTERS (>= 4)
  {
    deviceId: "RT-EDGE-01",
    deviceClass: "router",
    model: "Cisco ISR 4331 (WAN edge)",
    location: "Network Closet",
    ipAddress: "10.0.6.254",
    macAddress: "00:1E:2D:3C:4B:11",
    rackUnit: 40,
    hostname: "rt-edge-01.gzu.local",
  },
  {
    deviceId: "RT-CAMPUS-01",
    deviceClass: "router",
    model: "MikroTik CCR1036",
    location: "Server Room",
    ipAddress: "10.0.2.254",
    macAddress: "00:1E:2D:3C:4B:12",
    rackUnit: 20,
    hostname: "rt-campus-01.gzu.local",
  },
  {
    deviceId: "RT-WIFI-GW-01",
    deviceClass: "router",
    model: "Ubiquiti EdgeRouter 4",
    location: "Admin Block",
    ipAddress: "10.0.0.254",
    macAddress: "00:1E:2D:3C:4B:13",
    hostname: "rt-wifi-gw-01.gzu.local",
  },
  {
    deviceId: "RT-BRANCH-01",
    deviceClass: "router",
    model: "Cisco 2901",
    location: "Library",
    ipAddress: "10.0.5.254",
    macAddress: "00:1E:2D:3C:4B:14",
    hostname: "rt-branch-01.gzu.local",
  },

  // SERVERS (>= 4)
  {
    deviceId: "SRV-FILE-01",
    deviceClass: "server",
    model: "Dell PowerEdge R740 (File Server)",
    location: "Server Room",
    ipAddress: "10.0.2.10",
    macAddress: "AC:DE:48:00:11:01",
    rackUnit: 12,
    hostname: "srv-file-01.gzu.local",
  },
  {
    deviceId: "SRV-WEB-01",
    deviceClass: "server",
    model: "HP ProLiant DL380 (Web/App Server)",
    location: "Server Room",
    ipAddress: "10.0.2.20",
    macAddress: "AC:DE:48:00:11:02",
    rackUnit: 11,
    hostname: "srv-web-01.gzu.local",
  },
  {
    deviceId: "SRV-DB-01",
    deviceClass: "server",
    model: "Dell PowerEdge R640 (Database)",
    location: "Server Room",
    ipAddress: "10.0.2.30",
    macAddress: "AC:DE:48:00:11:03",
    rackUnit: 10,
    hostname: "srv-db-01.gzu.local",
  },
  {
    deviceId: "SRV-BACKUP-01",
    deviceClass: "server",
    model: "Synology RS1221+ (Backup NAS)",
    location: "Server Room",
    ipAddress: "10.0.2.40",
    macAddress: "AC:DE:48:00:11:04",
    rackUnit: 9,
    hostname: "srv-backup-01.gzu.local",
  },

  // WORKSTATIONS (>= 7)
  {
    deviceId: "WS-BURSARY-01",
    deviceClass: "workstation",
    model: "Dell OptiPlex 7090",
    location: "Bursary Department",
    ipAddress: "10.0.1.101",
    macAddress: "B0:4A:39:AA:01:01",
    hostname: "ws-bursary-01.gzu.local",
  },
  {
    deviceId: "WS-BURSARY-02",
    deviceClass: "workstation",
    model: "Dell OptiPlex 7090",
    location: "Bursary Department",
    ipAddress: "10.0.1.102",
    macAddress: "B0:4A:39:AA:01:02",
    hostname: "ws-bursary-02.gzu.local",
  },
  {
    deviceId: "WS-LAB-A-01",
    deviceClass: "workstation",
    model: "Lenovo ThinkCentre",
    location: "Computer Lab A",
    ipAddress: "10.0.3.101",
    macAddress: "B0:4A:39:AA:03:01",
    hostname: "ws-lab-a-01.gzu.local",
  },
  {
    deviceId: "WS-LAB-A-02",
    deviceClass: "workstation",
    model: "Lenovo ThinkCentre",
    location: "Computer Lab A",
    ipAddress: "10.0.3.102",
    macAddress: "B0:4A:39:AA:03:02",
    hostname: "ws-lab-a-02.gzu.local",
  },
  {
    deviceId: "WS-LAB-B-01",
    deviceClass: "workstation",
    model: "HP EliteDesk 800",
    location: "Computer Lab B",
    ipAddress: "10.0.4.101",
    macAddress: "B0:4A:39:AA:04:01",
    hostname: "ws-lab-b-01.gzu.local",
  },
  {
    deviceId: "WS-LAB-B-02",
    deviceClass: "workstation",
    model: "HP EliteDesk 800",
    location: "Computer Lab B",
    ipAddress: "10.0.4.102",
    macAddress: "B0:4A:39:AA:04:02",
    hostname: "ws-lab-b-02.gzu.local",
  },
  {
    deviceId: "WS-ADMIN-01",
    deviceClass: "workstation",
    model: "Dell OptiPlex 5090",
    location: "Admin Block",
    ipAddress: "10.0.0.101",
    macAddress: "B0:4A:39:AA:00:01",
    hostname: "ws-admin-01.gzu.local",
  },

  // PRINTERS (>= 4)
  {
    deviceId: "PRN-ADMIN-01",
    deviceClass: "printer",
    model: "HP LaserJet Enterprise M507",
    location: "Admin Block",
    ipAddress: "10.0.0.201",
    macAddress: "00:25:96:FF:00:01",
    hostname: "prn-admin-01.gzu.local",
  },
  {
    deviceId: "PRN-BURSARY-01",
    deviceClass: "printer",
    model: "Canon imageRUNNER 2630",
    location: "Bursary Department",
    ipAddress: "10.0.1.201",
    macAddress: "00:25:96:FF:01:01",
    hostname: "prn-bursary-01.gzu.local",
  },
  {
    deviceId: "PRN-LIB-01",
    deviceClass: "printer",
    model: "Epson EcoTank L3250",
    location: "Library",
    ipAddress: "10.0.5.201",
    macAddress: "00:25:96:FF:05:01",
    hostname: "prn-lib-01.gzu.local",
  },
  {
    deviceId: "PRN-LAB-A-01",
    deviceClass: "printer",
    model: "HP LaserJet Pro M404",
    location: "Computer Lab A",
    ipAddress: "10.0.3.201",
    macAddress: "00:25:96:FF:03:01",
    hostname: "prn-lab-a-01.gzu.local",
  },

  // ACCESS POINTS (>= 4)
  {
    deviceId: "AP-ADMIN-01",
    deviceClass: "access_point",
    model: "Ubiquiti UniFi UAP-AC-Pro",
    location: "Admin Block",
    ipAddress: "10.0.0.51",
    macAddress: "F0:9F:C2:AA:00:51",
    hostname: "ap-admin-01.gzu.local",
  },
  {
    deviceId: "AP-BURSARY-01",
    deviceClass: "access_point",
    model: "Ubiquiti UniFi UAP-AC-Lite",
    location: "Bursary Department",
    ipAddress: "10.0.1.51",
    macAddress: "F0:9F:C2:AA:01:51",
    hostname: "ap-bursary-01.gzu.local",
  },
  {
    deviceId: "AP-LAB-A-01",
    deviceClass: "access_point",
    model: "TP-Link EAP245",
    location: "Computer Lab A",
    ipAddress: "10.0.3.51",
    macAddress: "F0:9F:C2:AA:03:51",
    hostname: "ap-lab-a-01.gzu.local",
  },
  {
    deviceId: "AP-LIB-01",
    deviceClass: "access_point",
    model: "Cisco Aironet 1815",
    location: "Library",
    ipAddress: "10.0.5.51",
    macAddress: "F0:9F:C2:AA:05:51",
    hostname: "ap-lib-01.gzu.local",
  },

  // MEDIA CONVERTERS (>= 2)
  {
    deviceId: "MC-ADMIN-01",
    deviceClass: "media_converter",
    model: "TP-Link MC220L (Fiber-to-RJ45)",
    location: "Admin Block",
    ipAddress: "10.0.0.60",
    macAddress: "00:0F:24:AA:00:60",
    hostname: "mc-admin-01.gzu.local",
  },
  {
    deviceId: "MC-CORE-01",
    deviceClass: "media_converter",
    model: "Allied Telesis AT-MC1008/SP",
    location: "Network Closet",
    ipAddress: "10.0.6.60",
    macAddress: "00:0F:24:AA:06:60",
    hostname: "mc-core-01.gzu.local",
  },

  // UPS (>= 2)
  {
    deviceId: "UPS-SR-01",
    deviceClass: "ups",
    model: "APC Smart-UPS 3000VA",
    location: "Server Room",
    ipAddress: "10.0.2.250",
    macAddress: "00:13:95:UP:02:50",
    hostname: "ups-sr-01.gzu.local",
  },
  {
    deviceId: "UPS-ADMIN-01",
    deviceClass: "ups",
    model: "CyberPower CP1500AVRLCD",
    location: "Admin Block",
    ipAddress: "10.0.0.250",
    macAddress: "00:13:95:UP:00:50",
    hostname: "ups-admin-01.gzu.local",
  },
];

export default INFRASTRUCTURE_DEVICES;
