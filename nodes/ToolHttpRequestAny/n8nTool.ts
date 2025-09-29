import { DynamicStructuredTool } from '@langchain/core/tools';
import type { DynamicStructuredToolInput } from '@langchain/core/tools';
import type { DynamicZodObject } from './utils';

export type N8nToolOptions = {
	name: string;
	description: string;
	func: DynamicStructuredToolInput['func'];
	schema: DynamicZodObject;
};

export class N8nTool extends DynamicStructuredTool {
	constructor(options: N8nToolOptions) {
		super({
			name: options.name,
			description: options.description,
			schema: options.schema,
			func: options.func,
		});
	}
}
