import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "uuid", type: "nvarchar", length: 255 })
    uuid: string;

    @Column({ name: "name", type: "nvarchar", length: 255 })
    name: string;

    @Column({ name: "email", type: "nvarchar", length: 255, unique: true })
    email: string;

    @Column({ name: "email_verified_at", type: "datetime", nullable: true })
    emailVerifiedAt: Date;

    @Column({ name: "password", type: "nvarchar", length: 255 })
    password: string;

    @Column({ name: "remember_token", type: "nvarchar", length: 100, nullable: true })
    rememberToken: string;

    @Column({ name: "fcm_token", type: "nvarchar", length: 255, nullable: true })
    fcmToken: string;

    @Column({ name: "created_at", type: "datetime", nullable: true })
    createdAt: Date;

    @Column({ name: "updated_at", type: "datetime", nullable: true })
    updatedAt: Date;

    @Column({ name: "avatar", type: "nvarchar", length: 255, nullable: true, default: "users/default.png" })
    avatar: string;

    @Column({ name: "role_id", type: "bigint", nullable: true })
    roleId: number;

    @Column({ name: "settings", type: "varchar", length: 50, nullable: true })
    settings: string;

    @Column({ name: "user_group", type: "varchar", length: 50, nullable: true })
    userGroup: string;

    @Column({ name: "user_loc", type: "varchar", length: 50, nullable: true })
    userLoc: string;
}