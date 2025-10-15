import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

//TypeOrm:
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../database/database.config';
import { User, Organization, Role, Permission, Task } from '../entities';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User, Organization, Role, Permission, Task]),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
