import {
    BadRequestException,
    Injectable,
    NestMiddleware,
} from '@nestjs/common';
import {
    Request as ExpressRequest,
    Response as ExpressResponse,
    NextFunction,
} from 'express';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
    constructor(private readonly postService: PostsService) {}

    async use(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        const postId = req.params.postId;

        if (!postId) {
            throw new BadRequestException('PostId 파라미터는 필수입니다.');
        }

        const exists = await this.postService.checkPostExistsById(
            parseInt(postId),
        );

        if (!exists) {
            throw new BadRequestException('Post가 존재하지 않습니다.');
        }

        next();
    }
}
