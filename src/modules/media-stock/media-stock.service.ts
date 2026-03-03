/* eslint-disable prettier/prettier */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    /* ================= FOLDERS ================= */

    async createFolder(dto: any) {
        if (dto.parentId) {
            const parent = await this.prisma.mediaFolder.findUnique({
                where: { id: dto.parentId },
            });

            if (!parent) throw new NotFoundException('Parent folder not found');
        }

        return this.prisma.mediaFolder.create({ data: dto });
    }

    async getFolders(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.mediaFolder.findMany({
                where: { deletedAt: null },
                skip,
                take: limit,
            }),
            this.prisma.mediaFolder.count({
                where: { deletedAt: null },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async getFolder(id: string) {
        const folder = await this.prisma.mediaFolder.findUnique({
            where: { id },
            include: { files: true },
        });

        if (!folder) throw new NotFoundException('Folder not found');

        return folder;
    }

    async getFolderTree(id: string) {
        const folder = await this.prisma.mediaFolder.findUnique({
            where: { id },
            include: {
                children: {
                    include: {
                        children: true,
                        files: true,
                    },
                },
                files: true,
            },
        });

        if (!folder) throw new NotFoundException('Folder not found');

        return folder;
    }

    async updateFolder(id: string, dto: any) {
        await this.getFolder(id);

        return this.prisma.mediaFolder.update({
            where: { id },
            data: dto,
        });
    }

    async deleteFolder(id: string) {
        await this.getFolder(id);

        return this.prisma.mediaFolder.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /* ================= FILES ================= */
    async uploadFiles(files: Express.Multer.File[], folderId: string) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Files are required');
        }

        if (!folderId) {
            throw new BadRequestException('FolderId is required');
        }

        const folder = await this.prisma.mediaFolder.findUnique({
            where: { id: folderId },
        });

        if (!folder) {
            throw new NotFoundException('Folder not found');
        }

        return this.prisma.mediaFile.createMany({
            data: files.map((file) => ({
                publicId: file.filename,
                url: `/uploads/${file.filename}`,
                mimeType: file.mimetype,
                fileSize: file.size,
                folderId,
            })),
        });
    }

    async getFiles(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.mediaFile.findMany({
                where: { deletedAt: null },
                skip,
                take: limit,
            }),
            this.prisma.mediaFile.count({
                where: { deletedAt: null },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async getFile(id: string) {
        const file = await this.prisma.mediaFile.findUnique({
            where: { id },
        });

        if (!file) throw new NotFoundException('File not found');

        return file;
    }

    async deleteFile(id: string) {
        await this.getFile(id);

        return this.prisma.mediaFile.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}