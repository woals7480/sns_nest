import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        MulterModule.register({
            limits: {
                // 바이트 단위
                fieldSize: 10000000,
            },
            fileFilter: (req, file, cb) => {
                /**
                 * cb
                 *
                 * 첫번째 파라미터에는 에러가 있을 경우 에러 정보를 넣어준다.
                 * 두번째 파라미터는 파일을 받을지 말지 boolean을 넣어준다.
                 */
                // xxx.jpg -> .jpg
                const ext = extname(file.originalname);
                const lowerExt = ext.toLowerCase();
                if (
                    lowerExt !== '.jpg' &&
                    lowerExt !== '.jpeg' &&
                    lowerExt !== '.png'
                ) {
                    return cb(
                        new BadRequestException(
                            'jpg/jpeg/png 파일만 업로드 가능합니다.',
                        ),
                        false,
                    );
                }

                return cb(null, true);
            },
            storage: multer.diskStorage({
                destination: function (req, res, cb) {
                    cb(null, TEMP_FOLDER_PATH);
                },
                filename: function (req, file, cb) {
                    cb(null, `${uuid()}${extname(file.originalname)}`);
                },
            }),
        }),
    ],
    controllers: [CommonController],
    providers: [CommonService],
    exports: [CommonService],
})
export class CommonModule {}
