import { IsString } from 'class-validator';
import { BaseModel } from 'src/common/entities/base.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.messge';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

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
}
