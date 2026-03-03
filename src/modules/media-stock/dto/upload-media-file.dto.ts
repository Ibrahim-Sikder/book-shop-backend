/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export class UploadMediaFileDto {
    @ApiProperty()
    @IsString()
    publicId: string;

    @ApiProperty()
    @IsString()
    url: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    fileSize?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    mimeType?: string;

    @ApiProperty()
    @IsUUID()
    folderId: string;
}