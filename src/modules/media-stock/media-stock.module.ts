/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { MediaController } from "./media-stock.controller";
import { MediaService } from "./media-stock.service";
import { PrismaService } from "src/prisma/prisma.service";


@Module({
    imports: [],
    controllers: [MediaController],
    providers: [MediaService, PrismaService],
})
export class MediaModule { }