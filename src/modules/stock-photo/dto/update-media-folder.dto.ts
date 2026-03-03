/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaFolderDto } from './create-media-folder.dto';

export class UpdateMediaFolderDto extends PartialType(
    CreateMediaFolderDto,
) { }