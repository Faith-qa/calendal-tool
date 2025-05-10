import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Logger } from 'nestjs-pino';

@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error);
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
    });

    this.connection.on('reconnectFailed', () => {
      this.logger.error('MongoDB reconnection failed');
    });
  }

  onModuleDestroy() {
    return this.connection.close();
  }

  getConnection(): Connection {
    return this.connection;
  }
} 