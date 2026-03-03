/* eslint-disable prettier/prettier */
import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    ValidationPipe,
    UsePipes,

} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockPhotoService } from './stock-photo.service';
import { Roles } from 'src/common/decorators/roles-decorator';
import { Role } from '@prisma/client';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFolderDto } from './dto/update-media-folder.dto';
import { UploadMediaFileDto } from './dto/upload-media-file.dto';

@ApiTags('stock-photo')
@Controller('stock-photo')
export class StockPhotoController {
    constructor(private readonly stockPhotoService: StockPhotoService) { }

    /* ===================== FOLDER ===================== */

    @Post('folder')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    async createFolder(@Body() dto: CreateMediaFolderDto) {
        return this.stockPhotoService.createFolder(dto);
    }

    @Get('folder')
    async findFolders() {
        return this.stockPhotoService.findFolders();
    }

    @Patch('folder/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    async updateFolder(
        @Param('id') id: string,
        @Body() dto: UpdateMediaFolderDto,
    ) {
        return this.stockPhotoService.updateFolder(id, dto);
    }

    @Delete('folder/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    async deleteFolder(@Param('id') id: string) {
        return this.stockPhotoService.deleteFolder(id);
    }

    /* ===================== FILE ===================== */

    @Post('upload')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async uploadFile(@Body() dto: UploadMediaFileDto) {
        return this.stockPhotoService.uploadFile(dto);
    }

    @Get(':id')
    async findFile(@Param('id') id: string) {
        return this.stockPhotoService.findFile(id);
    }

    @Delete(':id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    async deleteFile(@Param('id') id: string) {
        return this.stockPhotoService.deleteFile(id);
    }
}