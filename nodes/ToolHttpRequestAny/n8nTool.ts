import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import type { DynamicStructuredToolInput } from '@langchain/core/tools';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import type { ISupplyDataFunctions, ExecutionError } from 'n8n-workflow';
import { NodeConnectionTypes, jsonParse } from 'n8n-workflow';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodObjectAny = z.ZodObject<any, any, any, any>;

// Helper to get simplified type from Zod schema (matches official n8n)
function getSimplifiedType(zodType: z.ZodTypeAny): string {
	if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
		return getSimplifiedType(zodType.unwrap());
	}
	if (zodType instanceof z.ZodObject) return 'object';
	if (zodType instanceof z.ZodNumber) return 'number';
	if (zodType instanceof z.ZodBoolean) return 'boolean';
	return 'string';
}

// Generate parameter descriptions (matches official n8n)
function getParametersDescription(schema: ZodObjectAny): string {
	return Object.entries(schema.shape)
		.map(([name, prop]) => {
			const zodProp = prop as z.ZodTypeAny;
			const type = getSimplifiedType(zodProp);
			const desc = zodProp.description ?? '';
			const required = !zodProp.isOptional();
			return `${name}: (description: ${desc}, type: ${type}, required: ${required})`;
		})
		.join(',\n ');
}

// Generate description with parameter info for fallback DynamicTool (matches official n8n)
export function prepareFallbackToolDescription(
	description: string,
	schema: ZodObjectAny,
): string {
	const parametersDescription = getParametersDescription(schema);

	if (!parametersDescription) {
		return description;
	}

	const propertiesCount = Object.keys(schema.shape).length;
	return `${description}
Tool expects valid stringified JSON object with ${propertiesCount} properties.
Property names with description, type and required status:
${parametersDescription}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class N8nTool extends DynamicStructuredTool<any> {
	private context: ISupplyDataFunctions;

	constructor(
		context: ISupplyDataFunctions,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		fields: DynamicStructuredToolInput<any>,
	) {
		super(fields);
		this.context = context;
	}

	asDynamicTool(): DynamicTool {
		const wrappedFunc = async (query: string): Promise<string> => {
			const { index } = this.context.addInputData(NodeConnectionTypes.AiTool, [
				[{ json: { query } }],
			]);

			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let parsedInput: any;

				// Tier 1: Try structured parsing with Zod schema via StructuredOutputParser
				try {
					const parser = StructuredOutputParser.fromZodSchema(this.schema);
					parsedInput = await parser.parse(query);
				} catch {
					// Continue to next tier
				}

				// Tier 2: Relaxed JSON parsing + schema validation
				if (!parsedInput) {
					try {
						const parsed = jsonParse(query, { acceptJSObject: true });
						parsedInput = this.schema.parse(parsed);
					} catch {
						// Continue to next tier
					}
				}

				// Tier 3: Single parameter recovery
				if (!parsedInput) {
					const keys = Object.keys(this.schema.shape);
					if (keys.length === 1) {
						try {
							parsedInput = this.schema.parse({ [keys[0]]: query });
						} catch {
							// All tiers failed
						}
					}
				}

				if (!parsedInput) {
					throw new Error(
						'Could not parse tool input. Please provide valid JSON matching the expected schema.',
					);
				}

				const result = await this.func(parsedInput);
				this.context.addOutputData(NodeConnectionTypes.AiTool, index, [
					[{ json: { response: result } }],
				]);
				return result;
			} catch (error) {
				const errorMessage = `Error: ${(error as Error).message}`;
				this.context.addOutputData(
					NodeConnectionTypes.AiTool,
					index,
					error as ExecutionError,
				);
				return errorMessage;
			}
		};

		return new DynamicTool({
			name: this.name,
			description: prepareFallbackToolDescription(this.description, this.schema),
			func: wrappedFunc,
		});
	}
}
