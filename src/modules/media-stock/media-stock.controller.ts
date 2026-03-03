/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UploadedFile,
    UseInterceptors,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
    ParseIntPipe,
    UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media-stock.service';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFolderDto } from './dto/update-media-folder.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { RolesGuard } from 'src/common/guards/role-guards';
import { Roles } from 'src/common/decorators/roles-decorator';
import { Role } from '@prisma/client';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    /* ========================= FOLDERS ========================= */

    @Post('folders')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create media folder',
        description: 'Creates a new media folder (Admin only)',
    })
    @ApiResponse({ status: 201, description: 'Folder successfully created' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async createFolder(@Body() dto: CreateMediaFolderDto) {
        return await this.mediaService.createFolder(dto);
    }

    @Get('folders')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get all folders',
        description: 'Retrieve paginated list of folders',
    })
    @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
    async getFolders(
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    ) {
        return await this.mediaService.getFolders(page, limit);
    }

    @Get('folders/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get folder details',
        description: 'Retrieve single folder by ID',
    })
    @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Folder not found' })
    async getFolder(@Param('id', ParseUUIDPipe) id: string) {
        return await this.mediaService.getFolder(id);
    }

    @Get('folders/:id/tree')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get folder tree',
        description: 'Retrieve recursive folder tree',
    })
    async getFolderTree(@Param('id', ParseUUIDPipe) id: string) {
        return await this.mediaService.getFolderTree(id);
    }

    @Patch('folders/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update folder',
        description: 'Update folder details (Admin only)',
    })
    async updateFolder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateMediaFolderDto,
    ) {
        return await this.mediaService.updateFolder(id, dto);
    }

    @Delete('folders/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete folder',
        description: 'Delete folder by ID (Admin only)',
    })
    async deleteFolder(@Param('id', ParseUUIDPipe) id: string) {
        return await this.mediaService.deleteFolder(id);
    }

    /* ========================= FILES ========================= */
    @Post('files')
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(
        FilesInterceptor('files', 20, {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const unique =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, unique + extname(file.originalname));
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                    return cb(new Error('Only image files allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                folderId: { type: 'string', format: 'uuid' },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folderId', ParseUUIDPipe) folderId: string,
    ) {
        return this.mediaService.uploadFiles(files, folderId);
    }

    @Get('files')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get all media files',
        description: 'Retrieve paginated list of media files',
    })
    async getFiles(
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    ) {
        return await this.mediaService.getFiles(page, limit);
    }

    @Get('files/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get media file',
        description: 'Retrieve single media file by ID',
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    async getFile(@Param('id', ParseUUIDPipe) id: string) {
        return await this.mediaService.getFile(id);
    }

    @Delete('files/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete media file',
        description: 'Delete media file by ID (Admin only)',
    })
    async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
        return await this.mediaService.deleteFile(id);
    }
}