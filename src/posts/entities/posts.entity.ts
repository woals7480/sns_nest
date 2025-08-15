import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { BaseModel } from 'src/common/entities/base.entity';
import { ImageModel } from 'src/common/entities/image.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.messge';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CommentsModel } from '../comments/entities/comments.entity';

@Entity()
export class PostsModel extends BaseModel {
    // UsersModel과 연동
    // null이 되면 안됨
    @ManyToOne(() => UsersModel, (user) => user.posts, {
        nullable: false,
    })
    author: UsersModel;

    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    title: string;

    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    content: string;

    @Column()
    likeCount: number;

    @Column()
    commentCount: number;

    @OneToMany((type) => ImageModel, (image) => image.post)
    images: ImageModel[];

    @OneToMany(() => CommentsModel, (comment) => comment.author)
    comments: CommentsModel[];
}
