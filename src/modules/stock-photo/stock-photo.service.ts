/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFolderDto } from './dto/update-media-folder.dto';
import { UploadMediaFileDto } from './dto/upload-media-file.dto';

@Injectable()
export class StockPhotoService {
    constructor(private prisma: PrismaService) { }

    /* ===================== FOLDER ===================== */

    async createFolder(dto: CreateMediaFolderDto) {
        const exists = await this.prisma.mediaFolder.findFirst({
            where: {
                name: dto.name,
                parentId: dto.parentId ?? null,
            },
        });

        if (exists) {
            throw new BadRequestException('Folder already exists');
        }

        return this.prisma.mediaFolder.create({
            data: dto,
        });
    }

    async findFolders() {
        return this.prisma.mediaFolder.findMany({
            where: { deletedAt: null },
            include: {
                children: true,
                files: true,
            },
        });
    }

    async updateFolder(id: string, dto: UpdateMediaFolderDto) {
        await this.findFolderById(id);

        return this.prisma.mediaFolder.update({
            where: { id },
            data: dto,
        });
    }

    async deleteFolder(id: string) {
        await this.findFolderById(id);

        return this.prisma.mediaFolder.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async findFolderById(id: string) {
        const folder = await this.prisma.mediaFolder.findUnique({
            where: { id },
        });

        if (!folder) {
            throw new NotFoundException('Folder not found');
        }

        return folder;
    }

    /* ===================== FILE ===================== */

    async uploadFile(dto: UploadMediaFileDto) {
        await this.findFolderById(dto.folderId);

        return this.prisma.mediaFile.create({
            data: dto,
        });
    }

    async findFile(id: string) {
        const file = await this.prisma.mediaFile.findUnique({
            where: { id },
            include: { folder: true },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    async deleteFile(id: string) {
        await this.findFile(id);

        return this.prisma.mediaFile.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}