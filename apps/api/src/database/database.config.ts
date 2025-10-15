import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: join(process.cwd(), 'data', 'app.db'),
  entities: [join(__dirname, '..', 'entities', '*.entity{.ts,.js}')],
  synchronize: true, 
  logging: true, 
  autoLoadEntities: true, 
};