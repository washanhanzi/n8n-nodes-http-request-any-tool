import { mock } from 'jest-mock-extended'
import type { INode, ISupplyDataFunctions } from 'n8n-workflow'
import { jsonParse, NodeConnectionTypes } from 'n8n-workflow'

import type { N8nTool } from '../n8nTool'

import { ToolHttpRequestAny } from '../ToolHttpRequestAny.node'

describe('ToolHttpRequestAny', () => {
	const httpTool = new ToolHttpRequestAny()
	const helpers = mock<ISupplyDataFunctions['helpers']>()
	const executeFunctions = mock<ISupplyDataFunctions>({ helpers })

	beforeEach(() => {
		jest.resetAllMocks()
		executeFunctions.getNode.mockReturnValue(
			mock<INode>({
				type: 'n8n-nodes-base.toolHttpRequestAny',
				name: 'HTTP_Request_Tool',
				typeVersion: 1,
			}),
		)
		executeFunctions.addInputData.mockReturnValue({ index: 0 })
	})

	describe('Basic functionality', () => {
		it('should make a simple GET request without parameters', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: 'Hello World',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'toolDescription':
						return 'Get test data'
					case 'method':
						return 'GET'
					case 'url':
						return 'https://httpbin.org/get'
					case 'authentication':
						return 'none'
					case 'sendQuery':
						return false
					case 'sendHeaders':
						return false
					case 'sendBody':
						return false
					case 'placeholderDefinitions.values':
						return []
					case 'optimizeResponse':
						return false
					default:
						return undefined
				}
			})

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})
			expect(helpers.httpRequest).toHaveBeenCalled()
			expect(res).toEqual('Hello World')
		})

		it('should return the response object when receiving a JSON response', async () => {
			const mockJson = { hello: 'world', status: 'ok' }

			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify(mockJson),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'toolDescription':
						return 'Get JSON data'
					case 'method':
						return 'GET'
					case 'url':
						return 'https://httpbin.org/json'
					case 'authentication':
						return 'none'
					case 'sendQuery':
						return false
					case 'sendHeaders':
						return false
					case 'sendBody':
						return false
					case 'placeholderDefinitions.values':
						return []
					case 'optimizeResponse':
						return false
					default:
						return undefined
				}
			})

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})
			expect(helpers.httpRequest).toHaveBeenCalled()
			expect(jsonParse(res)).toEqual(mockJson)
		})
	})

	describe('Placeholder functionality', () => {
		it('should replace placeholder in URL', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ city: 'London', temp: 15 }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'toolDescription':
						return 'Get weather for a city'
					case 'method':
						return 'GET'
					case 'url':
						return 'https://api.weather.com/{city}'
					case 'authentication':
						return 'none'
					case 'sendQuery':
						return false
					case 'sendHeaders':
						return false
					case 'sendBody':
						return false
					case 'placeholderDefinitions.values':
						return [
							{
								name: 'city',
								type: 'string',
								description: 'The city name',
							},
						]
					case 'optimizeResponse':
						return false
					default:
						return undefined
				}
			})

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({ city: 'London' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringContaining('London'),
				}),
			)
			expect(res).toContain('London')
		})

		it('should handle multiple placeholders in URL', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: 'Resource found',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'toolDescription':
						return 'Get resource'
					case 'method':
						return 'GET'
					case 'url':
						return 'https://api.example.com/{version}/users/{userId}'
					case 'authentication':
						return 'none'
					case 'sendQuery':
						return false
					case 'sendHeaders':
						return false
					case 'sendBody':
						return false
					case 'placeholderDefinitions.values':
						return [
							{
								name: 'version',
								type: 'string',
								description: 'API version',
							},
							{
								name: 'userId',
								type: 'string',
								description: 'User ID',
							},
						]
					case 'optimizeResponse':
						return false
					default:
						return undefined
				}
			})

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({ version: 'v1', userId: '123' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringContaining('v1/users/123'),
				}),
			)
			expect(res).toEqual('Resource found')
		})
	})

	describe('Query parameters', () => {
		it('should send query parameters as keypairs', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ results: [] }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Search API'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/search'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return true
						case 'specifyQuery':
							return 'keypair'
						case 'parametersQuery.values':
							return [
								{
									name: 'q',
									valueProvider: 'modelRequired',
								},
								{
									name: 'Limit',
									valueProvider: 'fieldValue',
									value: 10,
								},
							]
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'q',
									type: 'string',
									description: 'Search query',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({ q: 'test' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						q: 'test',
						Limit: 10,
					}),
				}),
			)
		})

		it('should send query parameters as JSON', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ results: [] }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Search API'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/search'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return true
						case 'specifyQuery':
							return 'json'
						case 'jsonQuery':
							return '{"q": "{query}", "limit": 10}'
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'query',
									type: 'string',
									description: 'Search query',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({ query: 'test' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						q: 'test',
						limit: 10,
					}),
				}),
			)
		})
	})

	describe('Headers', () => {
		it('should send headers as keypairs', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: 'Success',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'API with headers'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/data'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return true
						case 'specifyHeaders':
							return 'keypair'
						case 'parametersHeaders.values':
							return [
								{
									name: 'X-Custom-Header',
									valueProvider: 'fieldValue',
									value: 'custom-value',
								},
							]
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			await (response as N8nTool).invoke({})
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Custom-Header': 'custom-value',
					}),
				}),
			)
		})
	})

	describe('Body', () => {
		it('should send body as keypairs', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ id: 1, status: 'created' }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Create resource'
						case 'method':
							return 'POST'
						case 'url':
							return 'https://api.example.com/resources'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return true
						case 'specifyBody':
							return 'keypair'
						case 'parametersBody.values':
							return [
								{
									name: 'name',
									valueProvider: 'modelRequired',
								},
								{
									name: 'Type',
									valueProvider: 'fieldValue',
									value: 'default',
								},
							]
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'name',
									type: 'string',
									description: 'Resource name',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({ name: 'test-resource' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({
						name: 'test-resource',
						Type: 'default',
					}),
				}),
			)
		})

		it('should report an error when a required body parameter is missing', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ id: 1 }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Create resource'
						case 'method':
							return 'POST'
						case 'url':
							return 'https://api.example.com/resources'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return true
						case 'specifyBody':
							return 'keypair'
						case 'parametersBody.values':
							return [
								{
									name: 'name',
									valueProvider: 'modelRequired',
								},
							]
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'name',
									type: 'string',
									description: 'Resource name',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const tool = response as N8nTool
			// Call the underlying function directly to bypass schema validation and reach error handling
			const toolFunc = (tool as unknown as { func: (input: unknown) => Promise<string> }).func

			const res = await toolFunc({})

			expect(res).toEqual('Input provided by model is not valid')
			expect(helpers.httpRequest).toHaveBeenCalledTimes(1)
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'https://api.example.com/resources',
					body: {},
					headers: expect.objectContaining({ 'User-Agent': undefined }),
				}),
			)
			expect(executeFunctions.addOutputData).toHaveBeenCalledTimes(1)
			const [connectionType, index, errorPayload] = executeFunctions.addOutputData.mock.calls[0]
			expect(connectionType).toBe(NodeConnectionTypes.AiTool)
			expect(index).toBe(0)
			expect(errorPayload).toBeInstanceOf(Error)
			expect((errorPayload as Error).message).toContain("Model did not provide parameter 'name'")
		})

		it('should send body as JSON', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ id: 1, status: 'created' }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Create resource'
						case 'method':
							return 'POST'
						case 'url':
							return 'https://api.example.com/resources'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return true
						case 'specifyBody':
							return 'json'
						case 'jsonBody':
							return '{"name": "{resourceName}", "type": "custom"}'
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'resourceName',
									type: 'string',
									description: 'Resource name',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			await (response as N8nTool).invoke({ resourceName: 'test-resource' })
			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({
						name: 'test-resource',
						type: 'custom',
					}),
				}),
			)
		})
	})

	describe('Authentication', () => {
		it('should handle authentication with predefined credentials', async () => {
			helpers.httpRequestWithAuthentication.mockResolvedValue({
				body: 'Authenticated response',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Authenticated API'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/protected'
						case 'authentication':
							return 'predefinedCredentialType'
						case 'nodeCredentialType':
							return 'linearApi'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})

			expect(res).toEqual('Authenticated response')

			expect(helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1)
			const [credType, options] = helpers.httpRequestWithAuthentication.mock.calls[0]
			expect(credType).toBe('linearApi')
			expect(options).toMatchObject({
				returnFullResponse: true,
				method: 'GET',
				url: 'https://api.example.com/protected',
			})
		})

		it('should handle authentication with generic credentials (Basic Auth)', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: 'Authenticated response',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Basic Auth API'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/protected'
						case 'authentication':
							return 'genericCredentialType'
						case 'genericAuthType':
							return 'httpBasicAuth'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			executeFunctions.getCredentials.mockResolvedValue({
				user: 'username',
				password: 'password',
			})

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})

			expect(res).toEqual('Authenticated response')

			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					returnFullResponse: true,
					auth: expect.objectContaining({
						username: 'username',
						password: 'password',
					}),
				}),
			)
		})

		it('should prevent placeholders in domain when using authentication', async () => {
			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Authenticated API'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://{domain}.example.com/api'
						case 'authentication':
							return 'predefinedCredentialType'
						case 'nodeCredentialType':
							return 'linearApi'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'domain',
									type: 'string',
									description: 'Domain name',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			await expect(httpTool.supplyData.call(executeFunctions, 0)).rejects.toThrow()
		})
	})

	describe('Binary response handling', () => {
		it('should return error when receiving a binary response', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: Buffer.from(''),
				headers: {
					'content-type': 'image/jpeg',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Get image'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://httpbin.org/image/jpeg'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})
			expect(helpers.httpRequest).toHaveBeenCalled()
			expect(res).toContain('error')
			expect(res).toContain('Binary data is not supported')
		})

		it('should return error when receiving text with null character', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: 'Hello\0World',
				headers: {
					'content-type': 'text/plain',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Get data'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://httpbin.org/text/plain'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)
			const res = await (response as N8nTool).invoke({})
			expect(helpers.httpRequest).toHaveBeenCalled()
			expect(res).toContain('error')
			expect(res).toContain('Binary data is not supported')
		})
	})

	describe('Optimize response', () => {
		it('should extract body from HTML response', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
      <h1>Test</h1>

      <div>
        <p>
          Test content
        </p>
      </div>
  </body>
</html>`,
				headers: {
					'content-type': 'text/html',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Get HTML'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://httpbin.org/html'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return true
						case 'responseType':
							return 'html'
						case 'cssSelector':
							return 'body'
						case 'onlyContent':
							return false
						case 'truncateResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			const res = await (response as N8nTool).invoke({})

			expect(helpers.httpRequest).toHaveBeenCalled()
			expect(res).toEqual(
				JSON.stringify(['<h1>Test</h1> <div> <p> Test content </p> </div>'], null, 2),
			)
		})
	})

	describe('Error handling', () => {
		it('should throw error for invalid node name', async () => {
			executeFunctions.getNode.mockReturnValue(
				mock<INode>({
					type: 'n8n-nodes-base.toolHttpRequestAny',
					name: 'Invalid-Node-Name!',
					typeVersion: 1,
				}),
			)

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Test'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com'
						case 'authentication':
							return 'none'
						default:
							return fallback
					}
				},
			)

			await expect(httpTool.supplyData.call(executeFunctions, 0)).rejects.toThrow()
		})

		it('should throw error for misconfigured placeholder', async () => {
			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Test'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'unusedPlaceholder',
									type: 'string',
									description: 'This placeholder is not used',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			await expect(httpTool.supplyData.call(executeFunctions, 0)).rejects.toThrow(
				/Misconfigured placeholder/,
			)
		})

		it('should handle HTTP errors gracefully', async () => {
			const error = new Error('Connection refused') as any
			error.httpCode = 500

			helpers.httpRequest.mockRejectedValue(error)

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Test'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return false
						case 'sendHeaders':
							return false
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return []
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)
			const res = await (response as N8nTool).invoke({})

			expect(res).toContain('HTTP 500')
			expect(res).toContain('Connection refused')
		})
	})

	describe('Complex scenarios', () => {
		it('should handle combination of URL placeholder, query params, and headers', async () => {
			helpers.httpRequest.mockResolvedValue({
				body: JSON.stringify({ success: true }),
				headers: {
					'content-type': 'application/json',
				},
			})

			executeFunctions.getNodeParameter.mockImplementation(
				(paramName: string, _: any, fallback: any) => {
					switch (paramName) {
						case 'toolDescription':
							return 'Complex API call'
						case 'method':
							return 'GET'
						case 'url':
							return 'https://api.example.com/{version}/data'
						case 'authentication':
							return 'none'
						case 'sendQuery':
							return true
						case 'specifyQuery':
							return 'keypair'
						case 'parametersQuery.values':
							return [
								{
									name: 'filter',
									valueProvider: 'modelRequired',
								},
							]
						case 'sendHeaders':
							return true
						case 'specifyHeaders':
							return 'keypair'
						case 'parametersHeaders.values':
							return [
								{
									name: 'X-API-Key',
									valueProvider: 'fieldValue',
									value: 'secret-key',
								},
							]
						case 'sendBody':
							return false
						case 'placeholderDefinitions.values':
							return [
								{
									name: 'version',
									type: 'string',
									description: 'API version',
								},
								{
									name: 'filter',
									type: 'string',
									description: 'Filter criteria',
								},
							]
						case 'optimizeResponse':
							return false
						default:
							return fallback
					}
				},
			)

			const { response } = await httpTool.supplyData.call(executeFunctions, 0)

			await (response as N8nTool).invoke({ version: 'v2', filter: 'active' })

			expect(helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringContaining('v2/data'),
					qs: expect.objectContaining({
						filter: 'active',
					}),
					headers: expect.objectContaining({
						'X-API-Key': 'secret-key',
					}),
				}),
			)
		})
	})
})
