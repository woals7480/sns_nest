import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageModel } from 'src/common/entities/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostImageDto } from './dto/create-image.dto';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';

@Injectable()
export class PostsImagesService {
    constructor(
        @InjectRepository(ImageModel)
        private readonly imageRepository: Repository<ImageModel>,
    ) {}

    getRepository(qr?: QueryRunner) {
        return qr
            ? qr.manager.getRepository<ImageModel>(ImageModel)
            : this.imageRepository;
    }

    async createPostImage(dto: CreatePostImageDto, qr?: QueryRunner) {
        // dto의 이미지 이름을 기반으로 파일 경로를 생성.
        if (dto.path) {
            const repository = this.getRepository(qr);
            const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);

            try {
                // 파일이 존재하는지 확인
                await promises.access(tempFilePath);
            } catch (e) {
                throw new BadRequestException('존재하지 않는 파일입니다.');
            }

            const filename = basename(tempFilePath);

            // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
            // {프로젝트 경로}/public/posts/asdf.jpg
            const newPath = join(POST_IMAGE_PATH, filename);

            // save
            const result = await repository.save({
                ...dto,
            });

            // 파일 옮기기
            await promises.rename(tempFilePath, newPath);

            return result;
        }
    }
}
