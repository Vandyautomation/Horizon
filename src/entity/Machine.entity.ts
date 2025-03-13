import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Location } from "./Location.ts";
import { MachineEquipment } from "./MachineEquipment.ts";
import { UAP } from "./Uap.ts";

export type MachineStatus = 'Running' | 'PlannedStop' | 'Changeover' | 'Breakdown' | 'OrgDisfunction' | 'NonQuality' | 'Microstop';

@Entity({ name: "MachineMST" })
export class Machine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "MchID", type: "varchar", length: 50, nullable: true })
    machineId: string;

    @Column({ name: "MchDesc", type: "varchar", length: 100, nullable: true })
    description: string;

    @Column({ name: "Barcode", type: "varchar", length: 30, primary: true })
    barcode: string;

    @Column({ name: "MchTon", type: "varchar", length: 20, nullable: true })
    tonage: string;

    @Column({ name: "MchProcess", type: "varchar", length: 50, nullable: true })
    process: string;

    @Column({ name: "MchNumber", type: "varchar", length: 10, nullable: true })
    number: string;

    @Column({ name: "MchStatus", type: "varchar", length: 50, nullable: true })
    status: MachineStatus;

    @Column({ name: "position", type: "varchar", length: 100, nullable: true })
    position: string;

    @Column({ name: "rotation", type: "varchar", length: 100, nullable: true })
    rotation: string;

    @Column({ name: "energyBudget", type: "decimal", precision: 38, scale: 0, nullable: true })
    energyBudget: number;

    @Column({ name: "MchLoc", type: "varchar", length: 50, nullable: true })
    locationName: string;

    @Column({ name: "UAP", type: "varchar", length: 20, nullable: true })
    uap: string;

    @Column({ name: "Active", type: "boolean", default: false })
    active: boolean;

    @Column({ name: "AndonFlag", type: "boolean", default: false })
    andonFlag: boolean;

    @Column({ name: "is_override", type: "boolean", nullable: true })
    isOverride: boolean;

    @Column({ name: "rfid", type: "varchar", length: 100, nullable: true })
    rfid: string;

    @Column({ name: "WorkCenter", type: "varchar", length: 100, nullable: true })
    workCenter: string;

    @OneToMany(() => MachineEquipment, machineEquipment => machineEquipment.machine)
    machineEquipments: MachineEquipment[];

    // Virtual property for total equipment energy budget
    equipmentEnergyBudget: number;
}