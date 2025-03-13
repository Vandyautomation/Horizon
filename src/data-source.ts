import { DataSource } from "typeorm";
import { Machine } from "../entities/Machine.entity";
import { Equipment } from "../entities/Equipment.entity";
import { MachineEquipment } from "../entities/MachineEquipment.entity";
import { User } from "../entities/User.entity";
import { Location } from "../entities/Location.entity";
import { UAP } from "../entities/Uap.entity";

export const AppDataSource = new DataSource({
    type: "mssql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "1433"),
    username: process.env.DB_USERNAME || "sa",
    password: process.env.DB_PASSWORD || "yourStrong(!)Password",
    database: process.env.DB_DATABASE || "yourDatabase",
    synchronize: false,
    logging: process.env.NODE_ENV !== "production",
    entities: [Machine, Equipment, MachineEquipment, User, Location, UAP],
    migrations: ["src/migrations/**/*.ts"],
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});