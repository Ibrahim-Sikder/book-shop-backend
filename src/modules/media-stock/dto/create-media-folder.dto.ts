/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum MediaType {
    IMAGE = 'IMAGE',
    PRODUCT = 'PRODUCT',
    DOCUMENT = 'DOCUMENT',
}

export class CreateMediaFolderDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: MediaType, required: false })
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    parentId?: string;
}