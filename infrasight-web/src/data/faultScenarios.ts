import type { Severity } from "./faultTypes";

export interface FaultScenarioTrigger {
  delaySeconds: number;
  deviceId: string;
  faultCode: string;
}

export interface FaultScenario {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  totalDurationSeconds: number;
  affectedDevices: string[];
  triggerChain: FaultScenarioTrigger[];
  impactSummary: string;
  recoverySteps: string[];
}

export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: "scn-broadcast-storm-admin",
    name: "Broadcast Storm — Admin Block",
    description:
      "MAC table overflow on SW-ADMIN-01 escalates to high CPU on SW-ADMIN-02; Admin workstations lose connectivity; Admin printer and AP go offline.",
    severity: "CRITICAL",
    totalDurationSeconds: 210,
    affectedDevices: [
      "SW-ADMIN-01",
      "SW-ADMIN-02",
      "WS-ADMIN-01",
      "PRN-ADMIN-01",
      "AP-ADMIN-01",
    ],
    triggerChain: [
      { delaySeconds: 0, deviceId: "SW-ADMIN-01", faultCode: "SW-003" },
      { delaySeconds: 30, deviceId: "SW-ADMIN-02", faultCode: "SW-007" },
      { delaySeconds: 60, deviceId: "WS-ADMIN-01", faultCode: "WS-007" },
      { delaySeconds: 90, deviceId: "PRN-ADMIN-01", faultCode: "PRN-009" },
      { delaySeconds: 120, deviceId: "AP-ADMIN-01", faultCode: "AP-003" },
      { delaySeconds: 180, deviceId: "SW-ADMIN-01", faultCode: "SW-010" },
    ],
    impactSummary:
      "Admin Block experiences severe network degradation; users lose connectivity; printing and Wi‑Fi service are interrupted.",
    recoverySteps: [
      "Isolate storm source by disabling affected access ports.",
      "Enable/adjust storm control on access interfaces.",
      "Verify spanning tree root and guard settings; remove loops.",
      "Clear MAC table entries and monitor stabilization.",
      "Restore services gradually; validate client connectivity.",
    ],
  },
  {
    id: "scn-wan-link-failure",
    name: "WAN Link Failure",
    description:
      "RT-EDGE-01 WAN interface goes down causing BGP session drop; OSPF re-routes; campus internet lost; Wi‑Fi gateway DHCP scope exhausted under reconvergence.",
    severity: "CRITICAL",
    totalDurationSeconds: 180,
    affectedDevices: ["RT-EDGE-01", "RT-CAMPUS-01", "RT-WIFI-GW-01"],
    triggerChain: [
      { delaySeconds: 0, deviceId: "RT-EDGE-01", faultCode: "RT-001" },
      { delaySeconds: 45, deviceId: "RT-EDGE-01", faultCode: "RT-002" },
      { delaySeconds: 90, deviceId: "RT-WIFI-GW-01", faultCode: "RT-009" },
    ],
    impactSummary:
      "Internet unreachable across campus; DHCP lease failures escalate user impact until routing restored.",
    recoverySteps: [
      "Verify physical WAN link and contact ISP.",
      "Validate BGP neighbor reachability and policies.",
      "Confirm OSPF paths; remove blackholes.",
      "Temporarily expand DHCP scope; restore normal after recovery.",
      "Run post‑incident review with ISP and core team.",
    ],
  },
  {
    id: "scn-server-room-thermal",
    name: "Server Room Thermal Event",
    description:
      "AC failure leads to SRV-FILE-01 temperature rise; CPU throttling and disk I/O slow; SRV-DB-01 memory exhaustion; SRV-BACKUP-01 service crash.",
    severity: "CRITICAL",
    totalDurationSeconds: 240,
    affectedDevices: ["SRV-FILE-01", "SRV-DB-01", "SRV-BACKUP-01"],
    triggerChain: [
      { delaySeconds: 0, deviceId: "SRV-FILE-01", faultCode: "SRV-008" },
      { delaySeconds: 60, deviceId: "SRV-FILE-01", faultCode: "SRV-001" },
      { delaySeconds: 120, deviceId: "SRV-FILE-01", faultCode: "SRV-004" },
      { delaySeconds: 150, deviceId: "SRV-DB-01", faultCode: "SRV-002" },
      { delaySeconds: 180, deviceId: "SRV-BACKUP-01", faultCode: "SRV-007" },
    ],
    impactSummary:
      "File and database services degrade; backups interrupted; risk of data loss rises until cooling restored.",
    recoverySteps: [
      "Restore AC and ensure stable ambient temperature.",
      "Reduce server load; pause non‑critical jobs.",
      "Check RAID and disk health; verify I/O latency.",
      "Restart failed services; validate database integrity.",
      "Monitor temps and performance post‑recovery.",
    ],
  },
  {
    id: "scn-ransomware-lab-a",
    name: "Ransomware Outbreak — Lab A",
    description:
      "Malware detected on WS-LAB-A-01 spreads to WS-LAB-A-02; traffic spike triggers broadcast storm risk on SW-LAB-A-01; ACL deny spike observed at RT-EDGE-01.",
    severity: "CRITICAL",
    totalDurationSeconds: 240,
    affectedDevices: ["WS-LAB-A-01", "WS-LAB-A-02", "SW-LAB-A-01", "RT-EDGE-01"],
    triggerChain: [
      { delaySeconds: 0, deviceId: "WS-LAB-A-01", faultCode: "WS-002" },
      { delaySeconds: 30, deviceId: "WS-LAB-A-02", faultCode: "WS-002" },
      { delaySeconds: 90, deviceId: "SW-LAB-A-01", faultCode: "SW-010" },
      { delaySeconds: 150, deviceId: "RT-EDGE-01", faultCode: "RT-010" },
    ],
    impactSummary:
      "Infected hosts disrupt lab network; switch and router controls mitigate but cause access restrictions.",
    recoverySteps: [
      "Isolate infected workstations from network.",
      "Run malware eradication and patch cycles.",
      "Enable storm control and review ACLs.",
      "Validate clean state before reconnecting hosts.",
      "Conduct user awareness training.",
    ],
  },
  {
    id: "scn-bursary-printer-chain",
    name: "Bursary Printer Failure Chain",
    description:
      "Paper jam on PRN-BURSARY-01 causes spooler stuck on WS-BURSARY-01; WS-BURSARY-02 CPU spike as users retry prints.",
    severity: "WARNING",
    totalDurationSeconds: 180,
    affectedDevices: ["PRN-BURSARY-01", "WS-BURSARY-01", "WS-BURSARY-02"],
    triggerChain: [
      { delaySeconds: 0, deviceId: "PRN-BURSARY-01", faultCode: "PRN-001" },
      { delaySeconds: 60, deviceId: "WS-BURSARY-01", faultCode: "PRN-010" },
      { delaySeconds: 120, deviceId: "WS-BURSARY-02", faultCode: "WS-001" },
    ],
    impactSummary:
      "Printing halted in Bursary; user devices slow due to retries until jam cleared and queue reset.",
    recoverySteps: [
      "Clear printer jam and verify rollers.",
      "Stop/clear spooler on WS-BURSARY-01, restart.",
      "Advise users to avoid repeated submits.",
      "Confirm successful test prints.",
    ],
  },
  {
    id: "scn-power-outage-partial-recovery",
    name: "Power Outage — Partial Recovery",
    description:
      "UPS-SR-01 switches to battery (mains failure) then battery low; SRV-WEB-01 ungraceful shutdown; SRV-DB-01 disk risk due to space/consistency.",
    severity: "CRITICAL",
    totalDurationSeconds: 300,
    affectedDevices: ["UPS-SR-01", "SRV-WEB-01", "SRV-DB-01"],
    triggerChain: [
      { delaySeconds: 0, deviceId: "UPS-SR-01", faultCode: "UPS-002" },
      { delaySeconds: 240, deviceId: "UPS-SR-01", faultCode: "UPS-001" },
      { delaySeconds: 260, deviceId: "SRV-WEB-01", faultCode: "SRV-011" },
      { delaySeconds: 290, deviceId: "SRV-DB-01", faultCode: "SRV-003" },
    ],
    impactSummary:
      "Power loss cascades to application/database risks; recovery depends on timely restoration and controlled shutdowns.",
    recoverySteps: [
      "Restore mains or start generator.",
      "Perform controlled shutdowns of non‑critical services.",
      "After power return, check filesystems and logs.",
      "Validate app integrity and data consistency.",
      "Review UPS runtime and battery health.",
    ],
  },
];

export default FAULT_SCENARIOS;
