import type { IHttpRequestOptions } from 'n8n-workflow';

export interface IHttpRequestOptionsExtended extends IHttpRequestOptions {
	responseFileName?: string;
}

export type HttpSslAuthCredentials = {
	ca?: string;
	cert?: string;
	key?: string;
	passphrase?: string;
};
