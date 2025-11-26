import { INodeProperties } from 'n8n-workflow';
import { optimizeResponseProperties } from './shared/optimizeResponse';

export const mainProperties: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Array Format in Query Parameters',
				name: 'queryParameterArrays',
				type: 'options',
				displayOptions: {
					show: {
						'/sendQuery': [true],
					},
				},
				options: [
					{
						name: 'No Brackets',
						value: 'repeat',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo=bar&foo=qux',
					},
					{
						name: 'Brackets Only',
						value: 'brackets',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo[]=bar&foo[]=qux',
					},
					{
						name: 'Brackets with Indices',
						value: 'indices',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo[0]=bar&foo[1]=qux',
					},
				],
				default: 'brackets',
			},
			{
				displayName: 'Batching',
				name: 'batching',
				placeholder: 'Add Batching',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					batch: {},
				},
				options: [
					{
						displayName: 'Batching',
						name: 'batch',
						values: [
							{
								displayName: 'Items per Batch',
								name: 'batchSize',
								type: 'number',
								typeOptions: {
									minValue: -1,
								},
								default: 50,
								description:
									'Input will be split in batches to throttle requests. -1 for disabled. 0 will be treated as 1.',
							},
							{
								// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
								displayName: 'Batch Interval (ms)',
								name: 'batchInterval',
								type: 'number',
								typeOptions: {
									minValue: 0,
								},
								default: 1000,
								description:
									'Time (in milliseconds) between each batch of requests. 0 for disabled.',
							},
						],
					},
				],
			},
			{
				displayName: 'Custom Error JSON',
				name: 'customErrorJson',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						onError: ['customJson'],
					},
				},
				description: 'The JSON to return when an error occurs',
			},
			{
				displayName: 'Ignore SSL Issues (Insecure)',
				name: 'allowUnauthorizedCerts',
				type: 'boolean',
				noDataExpression: true,
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-ignore-ssl-issues
				description:
					'Whether to download the response even if SSL certificate validation is not possible',
			},
			{
				displayName: 'Lowercase Headers',
				name: 'lowercaseHeaders',
				type: 'boolean',
				default: true,
				description: 'Whether to lowercase header names',
			},
			{
				displayName: 'On Error',
				name: 'onError',
				type: 'options',
				default: 'default',
				options: [
					{
						name: 'Default (Error)',
						value: 'default',
					},
					{
						name: 'Return Custom JSON',
						value: 'customJson',
					},
				],
				description: 'What to do when an error occurs',
			},
			{
				displayName: 'Pagination',
				name: 'pagination',
				placeholder: 'Add pagination',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					pagination: {},
				},
				options: [
					{
						displayName: 'Pagination',
						name: 'pagination',
						values: [
							{
								displayName: 'Complete Expression',
								name: 'completeExpression',
								type: 'string',
								displayOptions: {
									show: {
										paginationCompleteWhen: ['other'],
									},
								},
								default: '',
								description:
									'Should evaluate to true when pagination is complete. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination" target="_blank">More info</a>.',
							},
							{
								// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
								displayName: 'Interval Between Requests (ms)',
								name: 'requestInterval',
								type: 'number',
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								default: 0,
								description: 'Time in milliseconds to wait between requests',
								hint: 'At 0 no delay will be added',
								typeOptions: {
									minValue: 0,
								},
							},
							{
								displayName: 'Limit Pages Fetched',
								name: 'limitPagesFetched',
								type: 'boolean',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								default: false,
								noDataExpression: true,
								description: 'Whether the number of requests should be limited',
							},
							{
								displayName: 'Max Pages',
								name: 'maxRequests',
								type: 'number',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									show: {
										limitPagesFetched: [true],
									},
								},
								default: 100,
								description: 'Maximum amount of request to be make',
							},
							{
								displayName: 'Next URL',
								name: 'nextURL',
								type: 'string',
								displayOptions: {
									show: {
										paginationMode: ['responseContainsNextURL'],
									},
								},
								default: '',
								description:
									'Should evaluate to the URL of the next page. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination" target="_blank">More info</a>.',
							},
							{
								displayName: 'Pagination Complete When',
								name: 'paginationCompleteWhen',
								type: 'options',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								options: [
									{
										name: 'Response Is Empty',
										value: 'responseIsEmpty',
									},
									{
										name: 'Receive Specific Status Code(s)',
										value: 'receiveSpecificStatusCodes',
									},
									{
										name: 'Other',
										value: 'other',
									},
								],
								default: 'responseIsEmpty',
								description: 'When should no further requests be made?',
							},
							{
								displayName: 'Pagination Mode',
								name: 'paginationMode',
								type: 'options',
								typeOptions: {
									noDataExpression: true,
								},
								options: [
									{
										name: 'Off',
										value: 'off',
									},
									{
										name: 'Update a Parameter in Each Request',
										value: 'updateAParameterInEachRequest',
									},
									{
										name: 'Response Contains Next URL',
										value: 'responseContainsNextURL',
									},
								],
								default: 'updateAParameterInEachRequest',
								description: 'If pagination should be used',
							},
							{
								displayName: 'Parameters',
								name: 'parameters',
								type: 'fixedCollection',
								displayOptions: {
									show: {
										paginationMode: ['updateAParameterInEachRequest'],
									},
								},
								typeOptions: {
									multipleValues: true,
									noExpression: true,
								},
								placeholder: 'Add Parameter',
								default: {
									parameters: [
										{
											type: 'qs',
											name: '',
											value: '',
										},
									],
								},
								options: [
									{
										name: 'parameters',
										displayName: 'Parameter',
										values: [
											{
												displayName: 'Type',
												name: 'type',
												type: 'options',
												options: [
													{
														name: 'Body',
														value: 'body',
													},
													{
														name: 'Header',
														value: 'headers',
													},
													{
														name: 'Query',
														value: 'qs',
													},
												],
												default: 'qs',
												description: 'Where the parameter should be set',
											},
											{
												displayName: 'Name',
												name: 'name',
												type: 'string',
												default: '',
												placeholder: 'e.g page',
											},
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												hint: 'Use expression mode and $response to access response data',
											},
										],
									},
								],
							},
							{
								displayName: 'Status Code(s) when Complete',
								name: 'statusCodesWhenComplete',
								type: 'string',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									show: {
										paginationCompleteWhen: ['receiveSpecificStatusCodes'],
									},
								},
								default: '',
								description: 'Accepts comma-separated values',
							},
							{
								displayName:
									'Use the $response variables to access the data of the previous response. Refer to the <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.httprequest" target="_blank">docs</a> for more info about pagination/',
								name: 'webhookNotice',
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								type: 'notice',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Proxy',
				name: 'proxy',
				type: 'string',
				default: '',
				placeholder: 'e.g. http://myproxy:3128',
				description: 'HTTP proxy to use',
			},
			{
				displayName: 'Redirects',
				name: 'redirect',
				placeholder: 'Add Redirect',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: { redirect: {} },
				options: [
					{
						displayName: 'Redirect',
						name: 'redirect',
						values: [
							{
								displayName: 'Follow Redirects',
								name: 'followRedirects',
								type: 'boolean',
								default: false,
								noDataExpression: true,
								description: 'Whether to follow all redirects',
							},
							{
								displayName: 'Max Redirects',
								name: 'maxRedirects',
								type: 'number',
								displayOptions: {
									show: {
										followRedirects: [true],
									},
								},
								default: 21,
								description: 'Max number of redirects to follow',
							},
						],
					},
				],
				displayOptions: {
					show: {
						'@version': [1, 2, 3],
					},
				},
			},
			{
				displayName: 'Redirects',
				name: 'redirect',
				placeholder: 'Add Redirect',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					redirect: {},
				},
				options: [
					{
						displayName: 'Redirect',
						name: 'redirect',
						values: [
							{
								displayName: 'Follow Redirects',
								name: 'followRedirects',
								type: 'boolean',
								default: true,
								noDataExpression: true,
								description: 'Whether to follow all redirects',
							},
							{
								displayName: 'Max Redirects',
								name: 'maxRedirects',
								type: 'number',
								displayOptions: {
									show: {
										followRedirects: [true],
									},
								},
								default: 21,
								description: 'Max number of redirects to follow',
							},
						],
					},
				],
				displayOptions: {
					hide: {
						'@version': [1, 2, 3],
					},
				},
			},
			{
				displayName: 'Response',
				name: 'response',
				placeholder: 'Add response',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					response: {},
				},
				options: [
					{
						displayName: 'Response',
						name: 'response',
						values: [
							{
								displayName: 'Include Response Headers and Status',
								name: 'fullResponse',
								type: 'boolean',
								default: false,
								description:
									'Whether to return the full response (headers and response status code) data instead of only the body',
							},
							{
								displayName: 'Never Error',
								name: 'neverError',
								type: 'boolean',
								default: false,
								description: 'Whether to succeeds also when status code is not 2xx',
							},
							{
								displayName: 'Response Format',
								name: 'responseFormat',
								type: 'options',
								noDataExpression: true,
								options: [
									{
										name: 'Autodetect',
										value: 'autodetect',
									},
									{
										name: 'File',
										value: 'file',
									},
									{
										name: 'JSON',
										value: 'json',
									},
									{
										name: 'Text',
										value: 'text',
									},
								],
								default: 'autodetect',
								description: 'The format in which the data gets returned from the URL',
							},
							{
								displayName: 'Put Output in Field',
								name: 'outputPropertyName',
								type: 'string',
								default: 'data',
								required: true,
								displayOptions: {
									show: {
										responseFormat: ['file', 'text'],
									},
								},
								description:
									'Name of the binary property to which to write the data of the read file',
							},
						],
					},
				],
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 10000,
				description:
					'Time in ms to wait for the server to send response headers (and start the response body) before aborting the request',
			},
		],
	},
	...optimizeResponseProperties.map((prop) => ({
		...prop,
		displayOptions: {
			...prop.displayOptions,
			show: { ...prop.displayOptions?.show, '@tool': [true] },
		},
	})),
	{
		displayName:
			"You can view the raw requests this node makes in your browser's developer console",
		name: 'infoMessage',
		type: 'notice',
		default: '',
	},
];