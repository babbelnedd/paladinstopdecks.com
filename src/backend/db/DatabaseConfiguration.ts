'use strict';

export interface IDatabaseConfiguration {
    host: string;
    port?: string;
    db: string;
    user?: string;
    pass?: string;
    getCredentials(): {user:string, pass:string};
    getConnectionString():string;
}

export class DatabaseConfiguration implements IDatabaseConfiguration {
    public host:string = 'localhost';
    public port:string = '27017';
    public db:string;
    public user:string;
    public pass:string;

    public constructor(cfg:IDatabaseConfiguration) {
        this.host = cfg.host;
        this.port = cfg.port;
        this.db = cfg.db;
        this.user = cfg.user;
        this.pass = cfg.pass;
    }

    public getCredentials() {
        return {
            user: this.user,
            pass: this.pass
        };
    }

    public getConnectionString() {
        return `mongodb://${this.host}:${this.port}/${this.db}`;
    }
}